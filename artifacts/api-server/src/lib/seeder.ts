import { ilike, eq, and, or, isNull } from "drizzle-orm";
import { db, textsTable, paragraphsTable, progressTable } from "@workspace/db";
import { searchAndFetchText, generateInterlinearTranslation, lookupPublicationYears, lookupEnglishTitles } from "./ai";
import { logger } from "./logger";
import { waitForIdleForeground } from "./foregroundGate";

export async function backfillPublicationYears(): Promise<void> {
  try {
    const missing = await db
      .select({ id: textsTable.id, title: textsTable.title, author: textsTable.author })
      .from(textsTable)
      .where(isNull(textsTable.publicationYear));

    if (missing.length === 0) {
      logger.info("All texts already have publication years");
      return;
    }

    logger.info({ count: missing.length }, "Backfilling publication years");

    const BATCH = 25;
    let updated = 0;
    for (let i = 0; i < missing.length; i += BATCH) {
      const batch = missing.slice(i, i + BATCH);
      try {
        await waitForIdleForeground(3000);
        const years = await lookupPublicationYears(batch);
        for (const [id, year] of years.entries()) {
          await db
            .update(textsTable)
            .set({ publicationYear: year })
            .where(eq(textsTable.id, id));
          updated++;
        }
        logger.info({ batchSize: batch.length, gotYears: years.size, totalUpdated: updated }, "Year backfill batch done");
      } catch (err) {
        logger.error({ err, batchStart: i }, "Year backfill batch failed");
      }
    }

    logger.info({ updated, total: missing.length }, "Publication year backfill complete");
  } catch (err) {
    logger.error({ err }, "Publication year backfill failed");
  }
}

export async function backfillEnglishTitles(): Promise<void> {
  try {
    const missing = await db
      .select({ id: textsTable.id, title: textsTable.title, author: textsTable.author, language: textsTable.language })
      .from(textsTable)
      .where(or(isNull(textsTable.englishTitle), isNull(textsTable.englishAuthor)));

    if (missing.length === 0) {
      logger.info("All texts already have English titles and authors");
      return;
    }

    logger.info({ count: missing.length }, "Backfilling English titles/authors");

    const BATCH = 25;
    let updated = 0;
    for (let i = 0; i < missing.length; i += BATCH) {
      const batch = missing.slice(i, i + BATCH);
      try {
        await waitForIdleForeground(3000);
        const results = await lookupEnglishTitles(batch);
        for (const [id, { englishTitle, englishAuthor }] of results.entries()) {
          const patch: { englishTitle?: string; englishAuthor?: string } = {};
          if (englishTitle) patch.englishTitle = englishTitle;
          if (englishAuthor) patch.englishAuthor = englishAuthor;
          if (Object.keys(patch).length === 0) continue;
          await db
            .update(textsTable)
            .set(patch)
            .where(eq(textsTable.id, id));
          updated++;
        }
        logger.info({ batchSize: batch.length, gotResults: results.size, totalUpdated: updated }, "English backfill batch done");
      } catch (err) {
        logger.error({ err, batchStart: i }, "English backfill batch failed");
      }
    }

    logger.info({ updated, total: missing.length }, "English backfill complete");
  } catch (err) {
    logger.error({ err }, "English title backfill failed");
  }
}

export async function deduplicateCatalogTexts(): Promise<void> {
  try {
    // Group by (lower(title), lower(author)); keep the row with the highest paragraph_count
    // (ties → lowest id); delete the rest along with their paragraphs and progress.
    const { sql } = await import("drizzle-orm");
    const result = await db.execute(sql`
      WITH ranked AS (
        SELECT id,
               row_number() OVER (
                 PARTITION BY lower(title), lower(author)
                 ORDER BY paragraph_count DESC, id ASC
               ) AS rn
        FROM texts
      ),
      to_delete AS (
        SELECT id FROM ranked WHERE rn > 1
      ),
      del_progress AS (
        DELETE FROM progress WHERE text_id IN (SELECT id FROM to_delete)
      ),
      del_paragraphs AS (
        DELETE FROM paragraphs WHERE text_id IN (SELECT id FROM to_delete)
      )
      DELETE FROM texts WHERE id IN (SELECT id FROM to_delete) RETURNING id;
    `);
    const deleted = Array.isArray(result.rows) ? result.rows.length : 0;
    if (deleted > 0) {
      logger.info({ deleted }, "Deduplicated catalog texts");
    } else {
      logger.info("No duplicate catalog texts to remove");
    }
  } catch (err) {
    logger.error({ err }, "Catalog deduplication failed");
  }
}

export async function cleanBrokenCatalogEntries(): Promise<void> {
  try {
    const broken = await db
      .select({ id: textsTable.id, title: textsTable.title, language: textsTable.language })
      .from(textsTable)
      .where(
        or(
          // Only genuinely broken placeholder rows (the AI refused / returned a
          // copyright notice). English is now a first-class library language, so
          // we must NOT delete English texts merely for being English.
          ilike(textsTable.description ?? textsTable.title, "%cannot provide%"),
          ilike(textsTable.description ?? textsTable.title, "%under copyright%"),
        ),
      );
    if (broken.length === 0) return;
    for (const b of broken) {
      await db.delete(progressTable).where(eq(progressTable.textId, b.id));
      await db.delete(paragraphsTable).where(eq(paragraphsTable.textId, b.id));
      await db.delete(textsTable).where(eq(textsTable.id, b.id));
      logger.info({ id: b.id, title: b.title, language: b.language }, "Cleaned broken catalog entry");
    }
    logger.info({ count: broken.length }, "Catalog cleanup complete");
  } catch (err) {
    logger.error({ err }, "Failed to clean broken catalog entries");
  }
}

const CATALOG_QUERIES: Array<{ query: string; title: string; nationality?: "British" | "American" }> = [
  // ── English literature — British (public domain) ──
  { query: "Jane Austen Pride and Prejudice Chapter 1 in English", title: "Pride and Prejudice", nationality: "British" },
  { query: "Jane Austen Sense and Sensibility Chapter 1 in English", title: "Sense and Sensibility", nationality: "British" },
  { query: "Jane Austen Emma Chapter 1 in English", title: "Emma", nationality: "British" },
  { query: "Charles Dickens A Tale of Two Cities Book 1 Chapter 1 opening in English", title: "A Tale of Two Cities", nationality: "British" },
  { query: "Charles Dickens Great Expectations Chapter 1 in English", title: "Great Expectations", nationality: "British" },
  { query: "Charles Dickens Oliver Twist Chapter 1 in English", title: "Oliver Twist", nationality: "British" },
  { query: "Charlotte Brontë Jane Eyre Chapter 1 in English", title: "Jane Eyre", nationality: "British" },
  { query: "Emily Brontë Wuthering Heights Chapter 1 in English", title: "Wuthering Heights", nationality: "British" },
  { query: "Mary Shelley Frankenstein Letter 1 and Chapter 1 opening in English", title: "Frankenstein", nationality: "British" },
  { query: "Lewis Carroll Alice's Adventures in Wonderland Chapter 1 in English", title: "Alice's Adventures in Wonderland", nationality: "British" },
  { query: "Oscar Wilde The Picture of Dorian Gray Chapter 1 opening in English", title: "The Picture of Dorian Gray", nationality: "British" },
  { query: "Arthur Conan Doyle A Study in Scarlet Chapter 1 in English", title: "A Study in Scarlet", nationality: "British" },
  { query: "Arthur Conan Doyle The Adventures of Sherlock Holmes — A Scandal in Bohemia opening in English", title: "A Scandal in Bohemia", nationality: "British" },
  { query: "Bram Stoker Dracula Chapter 1 opening in English", title: "Dracula", nationality: "British" },
  { query: "Robert Louis Stevenson Strange Case of Dr Jekyll and Mr Hyde Chapter 1 in English", title: "Dr Jekyll and Mr Hyde", nationality: "British" },
  { query: "George Eliot Middlemarch Prelude and Chapter 1 opening in English", title: "Middlemarch", nationality: "British" },
  { query: "Thomas Hardy Tess of the d'Urbervilles Chapter 1 in English", title: "Tess of the d'Urbervilles", nationality: "British" },
  { query: "Jonathan Swift Gulliver's Travels Part 1 Chapter 1 in English", title: "Gulliver's Travels", nationality: "British" },
  { query: "Daniel Defoe Robinson Crusoe Chapter 1 opening in English", title: "Robinson Crusoe", nationality: "British" },
  { query: "Joseph Conrad Heart of Darkness Part 1 opening in English", title: "Heart of Darkness", nationality: "British" },

  // ── English poetry & drama — British (public domain) ──
  { query: "William Shakespeare Sonnet 18 'Shall I compare thee to a summer's day' full text in English", title: "Sonnet 18", nationality: "British" },
  { query: "William Shakespeare Sonnet 116 'Let me not to the marriage of true minds' full text in English", title: "Sonnet 116", nationality: "British" },
  { query: "William Shakespeare Sonnet 130 'My mistress' eyes are nothing like the sun' full text in English", title: "Sonnet 130", nationality: "British" },
  { query: "William Shakespeare Hamlet 'To be, or not to be' soliloquy full speech in English", title: "Hamlet — To Be or Not to Be", nationality: "British" },
  { query: "William Shakespeare Macbeth 'Tomorrow, and tomorrow, and tomorrow' soliloquy full speech in English", title: "Macbeth — Tomorrow Soliloquy", nationality: "British" },
  { query: "William Shakespeare The Tempest 'Our revels now are ended' speech full text in English", title: "The Tempest — Our Revels Now Are Ended", nationality: "British" },
  { query: "John Donne 'Death, be not proud' Holy Sonnet 10 full text in English", title: "Death, Be Not Proud", nationality: "British" },
  { query: "John Donne 'The Sun Rising' full poem in English", title: "The Sun Rising", nationality: "British" },
  { query: "John Donne 'A Valediction: Forbidding Mourning' full poem in English", title: "A Valediction: Forbidding Mourning", nationality: "British" },
  { query: "John Dryden 'Mac Flecknoe' opening lines in English", title: "Mac Flecknoe", nationality: "British" },
  { query: "John Dryden 'Absalom and Achitophel' opening lines in English", title: "Absalom and Achitophel", nationality: "British" },
  { query: "John Milton Paradise Lost Book 1 opening invocation in English", title: "Paradise Lost — Book I", nationality: "British" },
  { query: "Christopher Marlowe Doctor Faustus opening soliloquy in English", title: "Doctor Faustus", nationality: "British" },
  { query: "Edmund Spenser The Faerie Queene Book 1 Canto 1 opening stanzas in English", title: "The Faerie Queene — Book I", nationality: "British" },
  { query: "Andrew Marvell 'To His Coy Mistress' full poem in English", title: "To His Coy Mistress", nationality: "British" },
  { query: "George Herbert 'The Collar' full poem in English", title: "The Collar", nationality: "British" },
  { query: "Alexander Pope 'The Rape of the Lock' Canto 1 opening in English", title: "The Rape of the Lock", nationality: "British" },
  { query: "Thomas Gray 'Elegy Written in a Country Churchyard' opening stanzas in English", title: "Elegy Written in a Country Churchyard", nationality: "British" },
  { query: "William Blake 'The Tyger' full poem in English", title: "The Tyger", nationality: "British" },
  { query: "William Wordsworth 'I Wandered Lonely as a Cloud' full poem in English", title: "I Wandered Lonely as a Cloud", nationality: "British" },
  { query: "Samuel Taylor Coleridge 'Kubla Khan' full poem in English", title: "Kubla Khan", nationality: "British" },
  { query: "Lord Byron 'She Walks in Beauty' full poem in English", title: "She Walks in Beauty", nationality: "British" },
  { query: "Percy Bysshe Shelley 'Ozymandias' full poem in English", title: "Ozymandias", nationality: "British" },
  { query: "John Keats 'Ode to a Nightingale' opening stanzas in English", title: "Ode to a Nightingale", nationality: "British" },
  { query: "Alfred Lord Tennyson 'The Charge of the Light Brigade' full poem in English", title: "The Charge of the Light Brigade", nationality: "British" },

  // ── English literature — American (public domain) ──
  { query: "Mark Twain Adventures of Huckleberry Finn Chapter 1 in English", title: "Adventures of Huckleberry Finn", nationality: "American" },
  { query: "Mark Twain The Adventures of Tom Sawyer Chapter 1 in English", title: "The Adventures of Tom Sawyer", nationality: "American" },
  { query: "Herman Melville Moby-Dick Chapter 1 (Loomings) opening in English", title: "Moby-Dick", nationality: "American" },
  { query: "Nathaniel Hawthorne The Scarlet Letter Chapter 1 (The Prison-Door) in English", title: "The Scarlet Letter", nationality: "American" },
  { query: "Edgar Allan Poe The Tell-Tale Heart full opening in English", title: "The Tell-Tale Heart", nationality: "American" },
  { query: "Edgar Allan Poe The Fall of the House of Usher opening in English", title: "The Fall of the House of Usher", nationality: "American" },
  { query: "Louisa May Alcott Little Women Chapter 1 in English", title: "Little Women", nationality: "American" },
  { query: "Henry David Thoreau Walden Chapter 1 (Economy) opening in English", title: "Walden", nationality: "American" },
  { query: "Walt Whitman Leaves of Grass — Song of Myself opening sections in English", title: "Song of Myself", nationality: "American" },
  { query: "Kate Chopin The Awakening Chapter 1 in English", title: "The Awakening", nationality: "American" },
  { query: "Jack London The Call of the Wild Chapter 1 in English", title: "The Call of the Wild", nationality: "American" },
  { query: "Stephen Crane The Red Badge of Courage Chapter 1 in English", title: "The Red Badge of Courage", nationality: "American" },
  { query: "F. Scott Fitzgerald The Great Gatsby Chapter 1 opening in English", title: "The Great Gatsby", nationality: "American" },
  { query: "Harriet Beecher Stowe Uncle Tom's Cabin Chapter 1 in English", title: "Uncle Tom's Cabin", nationality: "American" },
  { query: "Washington Irving The Legend of Sleepy Hollow opening in English", title: "The Legend of Sleepy Hollow", nationality: "American" },
  { query: "Edith Wharton The Age of Innocence Book 1 Chapter 1 in English", title: "The Age of Innocence", nationality: "American" },


  // === PRIORITY: Russian & Japanese (front-loaded so they appear in the library first) ===

  // Pushkin (1799-1837)
  { query: "Pushkin Евгений Онегин (Eugene Onegin) Chapter 1 stanzas 1-10 in Russian", title: "Евгений Онегин — I" },
  { query: "Pushkin Евгений Онегин (Eugene Onegin) Chapter 2 opening in Russian", title: "Евгений Онегин — II" },
  { query: "Pushkin Капитанская дочка (The Captain's Daughter) Chapter 1 in Russian", title: "Капитанская дочка — I" },
  { query: "Pushkin Пиковая дама (The Queen of Spades) Chapter 1 in Russian", title: "Пиковая дама — I" },
  { query: "Pushkin Повести Белкина — Выстрел (The Shot) opening in Russian", title: "Выстрел" },
  { query: "Pushkin Борис Годунов opening scene in Russian", title: "Борис Годунов" },
  { query: "Pushkin Медный всадник (The Bronze Horseman) prologue in Russian", title: "Медный всадник" },

  // Turgenev (1818-1883)
  { query: "Turgenev Отцы и дети (Fathers and Sons) Chapter 1 in Russian", title: "Отцы и дети — I" },
  { query: "Turgenev Отцы и дети (Fathers and Sons) Chapter 5 in Russian", title: "Отцы и дети — V" },
  { query: "Turgenev Записки охотника — Хорь и Калиныч in Russian", title: "Хорь и Калиныч" },
  { query: "Turgenev Дворянское гнездо (A Nest of the Gentry) Chapter 1 in Russian", title: "Дворянское гнездо — I" },
  { query: "Turgenev Первая любовь (First Love) Chapter 1 in Russian", title: "Первая любовь — I" },
  { query: "Turgenev Ася (Asya) opening in Russian", title: "Ася" },

  // Chekhov (1860-1904)
  { query: "Chekhov Дама с собачкой (The Lady with the Dog) Part 1 in Russian", title: "Дама с собачкой — I" },
  { query: "Chekhov Палата №6 (Ward No. 6) Chapter 1 in Russian", title: "Палата №6 — I" },
  { query: "Chekhov Степь (The Steppe) Chapter 1 in Russian", title: "Степь — I" },
  { query: "Chekhov Чайка (The Seagull) Act 1 opening in Russian", title: "Чайка" },
  { query: "Chekhov Вишнёвый сад (The Cherry Orchard) Act 1 opening in Russian", title: "Вишнёвый сад" },
  { query: "Chekhov Три сестры (Three Sisters) Act 1 opening in Russian", title: "Три сестры" },
  { query: "Chekhov Ванька (Vanka) opening in Russian", title: "Ванька" },
  { query: "Chekhov Студент (The Student) opening in Russian", title: "Студент" },

  // Tolstoy (1828-1910)
  { query: "Tolstoy Война и мир (War and Peace) Volume 1 Part 1 Chapter 1 in Russian", title: "Война и мир — I" },
  { query: "Tolstoy Война и мир (War and Peace) Volume 1 Part 1 Chapter 6 in Russian", title: "Война и мир — VI" },
  { query: "Tolstoy Анна Каренина (Anna Karenina) Part 1 Chapter 1 in Russian", title: "Анна Каренина — I" },
  { query: "Tolstoy Анна Каренина (Anna Karenina) Part 1 Chapter 6 in Russian", title: "Анна Каренина — VI" },
  { query: "Tolstoy Смерть Ивана Ильича (Death of Ivan Ilyich) Chapter 1 in Russian", title: "Смерть Ивана Ильича — I" },
  { query: "Tolstoy Крейцерова соната (Kreutzer Sonata) Chapter 1 in Russian", title: "Крейцерова соната — I" },
  { query: "Tolstoy Хаджи-Мурат opening in Russian", title: "Хаджи-Мурат" },
  { query: "Tolstoy Детство (Childhood) Chapter 1 in Russian", title: "Детство — I" },
  { query: "Tolstoy Севастопольские рассказы — Севастополь в декабре in Russian", title: "Севастополь в декабре" },

  // Natsume Sōseki (1867-1916)
  { query: "Natsume Sōseki 吾輩は猫である (I Am a Cat) Chapter 1 opening in Japanese", title: "吾輩は猫である — I" },
  { query: "Natsume Sōseki こころ (Kokoro) Part 1 Chapter 1 in Japanese", title: "こころ — I" },
  { query: "Natsume Sōseki こころ (Kokoro) Part 1 Chapter 2 in Japanese", title: "こころ — II" },
  { query: "Natsume Sōseki 坊っちゃん (Botchan) Chapter 1 in Japanese", title: "坊っちゃん — I" },
  { query: "Natsume Sōseki 草枕 (Kusamakura) Chapter 1 in Japanese", title: "草枕 — I" },
  { query: "Natsume Sōseki 三四郎 (Sanshirō) Chapter 1 in Japanese", title: "三四郎 — I" },
  { query: "Natsume Sōseki 門 (The Gate) Chapter 1 in Japanese", title: "門 — I" },
  { query: "Natsume Sōseki 夢十夜 First Night in Japanese", title: "夢十夜 — 第一夜" },

  // Murasaki Shikibu — Genji Monogatari (c. 1008)
  { query: "Genji Monogatari (源氏物語) Chapter 1 桐壺 (Kiritsubo) opening in classical Japanese", title: "源氏物語 — 桐壺" },
  { query: "Genji Monogatari (源氏物語) Chapter 2 帚木 (Hahakigi) opening in classical Japanese", title: "源氏物語 — 帚木" },
  { query: "Genji Monogatari (源氏物語) Chapter 5 若紫 (Wakamurasaki) opening in classical Japanese", title: "源氏物語 — 若紫" },
  { query: "Genji Monogatari (源氏物語) Chapter 9 葵 (Aoi) opening in classical Japanese", title: "源氏物語 — 葵" },

  // Chūshingura — The 47 Rōnin (Kanadehon Chūshingura, 1748)
  { query: "Kanadehon Chūshingura (仮名手本忠臣蔵) Act 1 opening in classical Japanese", title: "仮名手本忠臣蔵 — 一段目" },
  { query: "Kanadehon Chūshingura (仮名手本忠臣蔵) Act 3 opening in classical Japanese", title: "仮名手本忠臣蔵 — 三段目" },
  { query: "Kanadehon Chūshingura (仮名手本忠臣蔵) Act 7 — Ichiriki tea house scene in classical Japanese", title: "仮名手本忠臣蔵 — 七段目" },

  // Mishima Yukio — early public-domain work only
  { query: "Mishima Yukio early short story 花ざかりの森 opening in Japanese", title: "花ざかりの森" },

  // === Standard catalog continues ===

  // Il Principe — chapters 1-3 (existing), add more
  { query: "Il Principe by Machiavelli, chapters 1-3", title: "Il Principe" },
  { query: "Il Principe by Machiavelli, chapters 4-6", title: "Il Principe IV-VI" },
  { query: "Il Principe by Machiavelli, chapters 7-9", title: "Il Principe VII-IX" },
  { query: "Il Principe by Machiavelli, chapters 15-18", title: "Il Principe XV-XVIII" },

  // Divina Commedia — Inferno
  { query: "Divina Commedia, Inferno Canto I by Dante Alighieri", title: "Inferno" },
  { query: "Divina Commedia, Inferno Canto III by Dante Alighieri", title: "Inferno III" },
  { query: "Divina Commedia, Inferno Canto V by Dante Alighieri", title: "Inferno V" },
  { query: "Divina Commedia, Inferno Canto XXVI by Dante Alighieri", title: "Inferno XXVI" },
  { query: "Divina Commedia, Inferno Canto XXXIII by Dante Alighieri", title: "Inferno XXXIII" },
  { query: "Divina Commedia, Purgatorio Canto I by Dante Alighieri", title: "Purgatorio I" },
  { query: "Divina Commedia, Paradiso Canto I by Dante Alighieri", title: "Paradiso I" },

  // De Bello Gallico
  { query: "De Bello Gallico Book I chapters 1-5 by Julius Caesar", title: "Bello Gallico" },
  { query: "De Bello Gallico Book I chapters 6-12 by Julius Caesar", title: "Bello Gallico I.6-12" },
  { query: "De Bello Gallico Book II chapters 1-10 by Julius Caesar", title: "Bello Gallico II" },
  { query: "De Bello Gallico Book IV chapters 20-30 (Britain invasion) by Julius Caesar", title: "Bello Gallico IV" },
  { query: "De Bello Gallico Book VI chapters 13-20 (Druids) by Julius Caesar", title: "Bello Gallico VI" },

  // Dostoevsky — Russian
  { query: "Преступление и наказание by Fyodor Dostoevsky, opening of part 1 chapter 1 (original Russian)", title: "Преступление и наказание I.1" },
  { query: "Преступление и наказание by Fyodor Dostoevsky, part 1 chapter 2 (original Russian, tavern scene)", title: "Преступление и наказание I.2" },
  { query: "Преступление и наказание by Fyodor Dostoevsky, part 1 chapter 7 (original Russian, the murder)", title: "Преступление и наказание I.7" },
  { query: "Братья Карамазовы by Fyodor Dostoevsky, opening of book 1 chapter 1 (original Russian)", title: "Братья Карамазовы I.1" },
  { query: "Братья Карамазовы by Fyodor Dostoevsky, Grand Inquisitor chapter (original Russian)", title: "Братья Карамазовы: Великий инквизитор" },
  { query: "Идиот by Fyodor Dostoevsky, part 1 chapter 1 (original Russian, train scene)", title: "Идиот I.1" },
  { query: "Записки из подполья by Fyodor Dostoevsky, opening of part 1 (original Russian)", title: "Записки из подполья" },
  { query: "Бесы by Fyodor Dostoevsky, opening chapter (original Russian)", title: "Бесы I.1" },

  // Meditations — Marcus Aurelius
  { query: "Meditations Book I by Marcus Aurelius in Greek", title: "εἰς ἑαυτόν" },
  { query: "Meditations Book II by Marcus Aurelius in Greek", title: "εἰς ἑαυτόν II" },
  { query: "Meditations Book IV by Marcus Aurelius in Greek", title: "εἰς ἑαυτόν IV" },
  { query: "Meditations Book VII by Marcus Aurelius in Greek", title: "εἰς ἑαυτόν VII" },

  // Aeneid
  { query: "Aeneid Book I opening by Virgil in Latin", title: "Aeneis" },
  { query: "Aeneid Book II opening (fall of Troy) by Virgil in Latin", title: "Aeneis II" },
  { query: "Aeneid Book IV opening (Dido) by Virgil in Latin", title: "Aeneis IV" },
  { query: "Aeneid Book VI opening (underworld) by Virgil in Latin", title: "Aeneis VI" },

  // Iliad
  { query: "Iliad Book I opening by Homer in Ancient Greek", title: "Ἰλιάς" },
  { query: "Iliad Book VI (Hector and Andromache) by Homer in Ancient Greek", title: "Ἰλιάς VI" },
  { query: "Iliad Book XXII (death of Hector) by Homer in Ancient Greek", title: "Ἰλιάς XXII" },
  { query: "Iliad Book XXIV (Priam and Achilles) by Homer in Ancient Greek", title: "Ἰλιάς XXIV" },

  // Don Quijote
  { query: "Don Quijote Part 1 Chapter 1 by Cervantes in Spanish", title: "Quijote" },
  { query: "Don Quijote Part 1 Chapter 8 (windmills) by Cervantes in Spanish", title: "Quijote I.8" },
  { query: "Don Quijote Part 2 Chapter 10 by Cervantes in Spanish", title: "Quijote II.10" },

  // Les Misérables
  { query: "Les Misérables Part 1 Book 1 Chapter 1 by Victor Hugo in French", title: "Misérables" },
  { query: "Les Misérables Part 1 Book 2 Chapter 1 (Jean Valjean) by Victor Hugo in French", title: "Misérables I.2" },
  { query: "Les Misérables Part 2 Book 1 (Waterloo) by Victor Hugo in French", title: "Misérables II.1" },

  // Seneca
  { query: "Epistulae Morales Ad Lucilium Letter 1 by Seneca in Latin", title: "Epistulae Morales" },
  { query: "Epistulae Morales Ad Lucilium Letter 7 by Seneca in Latin", title: "Epistulae VII" },
  { query: "Epistulae Morales Ad Lucilium Letter 47 (on slaves) by Seneca in Latin", title: "Epistulae XLVII" },

  // Faust
  { query: "Faust Part I opening monologue by Goethe in German", title: "Faust" },
  { query: "Faust Part I 'Auerbachs Keller' scene by Goethe in German", title: "Faust — Auerbachs Keller" },
  { query: "Faust Part I 'Gretchen am Spinnrade' scene by Goethe in German", title: "Faust — Gretchen" },

  // Odyssey
  { query: "Odyssey Book I opening by Homer in Ancient Greek", title: "Ὀδύσσεια" },
  { query: "Odyssey Book V (Calypso) by Homer in Ancient Greek", title: "Ὀδύσσεια V" },
  { query: "Odyssey Book IX (Cyclops) by Homer in Ancient Greek", title: "Ὀδύσσεια IX" },
  { query: "Odyssey Book XXII (slaying of suitors) by Homer in Ancient Greek", title: "Ὀδύσσεια XXII" },

  // Lucretius
  { query: "De Rerum Natura Book I opening by Lucretius in Latin", title: "Rerum Natura" },
  { query: "De Rerum Natura Book II opening by Lucretius in Latin", title: "Rerum Natura II" },
  { query: "De Rerum Natura Book III (on death) by Lucretius in Latin", title: "Rerum Natura III" },

  // Horace
  { query: "Carmen I.1 Maecenas atavis by Horace in Latin", title: "Carmina" },
  { query: "Carmen I.9 Vides ut alta (Soracte) by Horace in Latin", title: "Carmina I.9" },
  { query: "Carmen I.11 Tu ne quaesieris (carpe diem) by Horace in Latin", title: "Carmina I.11" },
  { query: "Carmen III.30 Exegi monumentum by Horace in Latin", title: "Carmina III.30" },

  // Aristotle
  { query: "Nicomachean Ethics Book I opening by Aristotle in Greek", title: "Νικομάχεια" },
  { query: "Nicomachean Ethics Book II by Aristotle in Greek", title: "Νικομάχεια II" },
  { query: "Nicomachean Ethics Book X by Aristotle in Greek", title: "Νικομάχεια X" },

  // Baudelaire
  { query: "Les Fleurs du Mal opening poems by Baudelaire in French", title: "Fleurs du Mal" },
  { query: "Les Fleurs du Mal 'L'Albatros' and 'Correspondances' by Baudelaire in French", title: "Fleurs du Mal — Albatros" },
  { query: "Les Fleurs du Mal 'Le Voyage' by Baudelaire in French", title: "Fleurs du Mal — Voyage" },

  // Plato Republic
  { query: "Republic Book I opening by Plato in Ancient Greek", title: "Πολιτεία" },
  { query: "Republic Book II by Plato in Ancient Greek", title: "Πολιτεία II" },
  { query: "Republic Book VII (Allegory of the Cave) by Plato in Ancient Greek", title: "Πολιτεία VII" },

  // Ovid
  { query: "Metamorphoses Book I opening by Ovid in Latin", title: "Metamorphoses" },
  { query: "Metamorphoses Book III (Narcissus) by Ovid in Latin", title: "Metamorphoses III" },
  { query: "Metamorphoses Book X (Orpheus) by Ovid in Latin", title: "Metamorphoses X" },

  // Augustine
  { query: "Confessions Book I opening by Augustine in Latin", title: "Confessiones" },
  { query: "Confessions Book II (the pears) by Augustine in Latin", title: "Confessiones II" },
  { query: "Confessions Book VIII (conversion) by Augustine in Latin", title: "Confessiones VIII" },

  // Cicero
  { query: "Pro Archia Poeta opening by Cicero in Latin", title: "Pro Archia" },
  { query: "In Catilinam I opening (Quousque tandem) by Cicero in Latin", title: "In Catilinam I" },
  { query: "De Amicitia opening by Cicero in Latin", title: "De Amicitia" },

  // Catullus
  { query: "Catullus Carmen 1 and 5 in Latin", title: "Catulli Carmina" },
  { query: "Catullus Carmen 8 (Miser Catulle) and 13 in Latin", title: "Catulli Carmina VIII" },
  { query: "Catullus Carmen 51 and 85 (Odi et amo) in Latin", title: "Catulli Carmina LI" },

  // Tacitus
  { query: "Tacitus Annals Book I opening in Latin", title: "Annales" },
  { query: "Tacitus Annals Book XV chapters 38-44 (Great Fire of Rome) in Latin", title: "Annales XV" },
  { query: "Tacitus Germania chapters 1-10 in Latin", title: "Germania" },

  // Boccaccio
  { query: "Decameron Day 1 Introduction by Boccaccio in Italian", title: "Decameron" },
  { query: "Decameron Day 1 Novella 1 (Ser Ciappelletto) by Boccaccio in Italian", title: "Decameron I.1" },
  { query: "Decameron Day 4 Novella 5 (Lisabetta and the basil pot) by Boccaccio in Italian", title: "Decameron IV.5" },

  // Manzoni
  { query: "I Promessi Sposi Chapter 1 by Manzoni in Italian", title: "Promessi Sposi" },
  { query: "I Promessi Sposi Chapter 8 (Addio monti) by Manzoni in Italian", title: "Promessi Sposi VIII" },

  // Petrarch
  { query: "Canzoniere Sonnet 1 by Petrarch in Italian", title: "Canzoniere" },
  { query: "Canzoniere Sonnets 90 and 134 by Petrarch in Italian", title: "Canzoniere XC" },

  // Voltaire
  { query: "Candide Chapter 1 by Voltaire in French", title: "Candide" },
  { query: "Candide Chapters 2-3 by Voltaire in French", title: "Candide II-III" },
  { query: "Candide Chapter 30 conclusion (il faut cultiver notre jardin) by Voltaire in French", title: "Candide XXX" },

  // Flaubert
  { query: "Madame Bovary Part 1 Chapter 1 by Flaubert in French", title: "Madame Bovary" },
  { query: "Madame Bovary Part 2 Chapter 8 (Comices agricoles) by Flaubert in French", title: "Madame Bovary II.8" },

  // Saint-Exupéry
  { query: "Le Petit Prince Chapter 1 by Saint-Exupéry in French", title: "Petit Prince" },
  { query: "Le Petit Prince Chapter 21 (the fox) by Saint-Exupéry in French", title: "Petit Prince XXI" },

  // Pascal
  { query: "Pensées opening fragments by Pascal in French", title: "Pensées" },
  { query: "Pensées the wager (le pari) by Pascal in French", title: "Pensées — Pari" },

  // Spanish
  { query: "Lazarillo de Tormes Prologue and Tratado 1 in Spanish", title: "Lazarillo" },
  { query: "Lazarillo de Tormes Tratado 2 (the priest) in Spanish", title: "Lazarillo II" },
  { query: "Cien años de soledad opening by García Márquez in Spanish", title: "Cien años" },
  { query: "Rimas y Leyendas Rima I by Bécquer in Spanish", title: "Rimas" },
  { query: "Rimas Rima LIII (Volverán las oscuras golondrinas) by Bécquer in Spanish", title: "Rimas LIII" },

  // German
  { query: "Die Verwandlung opening by Kafka in German", title: "Verwandlung" },
  { query: "Die Verwandlung Part II by Kafka in German", title: "Verwandlung II" },
  { query: "Also sprach Zarathustra Prologue by Nietzsche in German", title: "Zarathustra" },
  { query: "Also sprach Zarathustra 'Von den drei Verwandlungen' by Nietzsche in German", title: "Zarathustra — Verwandlungen" },
  { query: "Der Tod in Venedig Chapter 1 by Thomas Mann in German", title: "Tod in Venedig" },

  // Plato Apology
  { query: "Apology opening by Plato in Ancient Greek", title: "Ἀπολογία" },
  { query: "Apology middle section (Socrates' defense) by Plato in Ancient Greek", title: "Ἀπολογία II" },
  { query: "Crito opening by Plato in Ancient Greek", title: "Κρίτων" },

  // Xenophon
  { query: "Anabasis Book I opening by Xenophon in Ancient Greek", title: "Ἀνάβασις" },
  { query: "Anabasis Book IV (Thalatta) by Xenophon in Ancient Greek", title: "Ἀνάβασις IV" },

  // Herodotus
  { query: "Histories Book I opening by Herodotus in Ancient Greek", title: "Ἱστορίαι" },
  { query: "Histories Book I Croesus and Solon by Herodotus in Ancient Greek", title: "Ἱστορίαι I — Solon" },

  // Sophocles
  { query: "Antigone Prologue by Sophocles in Ancient Greek", title: "Ἀντιγόνη" },
  { query: "Oedipus Rex Prologue by Sophocles in Ancient Greek", title: "Οἰδίπους" },
  { query: "Oedipus at Colonus opening by Sophocles in Ancient Greek", title: "Οἰδίπους ἐπὶ Κολωνῷ" },
  { query: "Ajax opening by Sophocles in Ancient Greek", title: "Αἴας" },

  // Senecan tragedy (Shakespeare's model)
  { query: "Seneca Thyestes Act I (Tantalus prologue) in Latin", title: "Thyestes" },
  { query: "Seneca Medea Act I in Latin", title: "Medea (Seneca)" },
  { query: "Seneca Phaedra Act I in Latin", title: "Phaedra" },
  { query: "Seneca Hercules Furens Act I in Latin", title: "Hercules Furens" },
  { query: "Seneca Oedipus Act I in Latin", title: "Oedipus (Seneca)" },
  { query: "Seneca Agamemnon Act I in Latin", title: "Agamemnon (Seneca)" },

  // Greek tragedy
  { query: "Aeschylus Agamemnon prologue in Ancient Greek", title: "Ἀγαμέμνων" },
  { query: "Aeschylus Prometheus Bound opening in Ancient Greek", title: "Προμηθεὺς Δεσμώτης" },
  { query: "Aeschylus Eumenides opening in Ancient Greek", title: "Εὐμενίδες" },
  { query: "Euripides Medea Prologue in Ancient Greek", title: "Μήδεια" },
  { query: "Euripides Bacchae Prologue in Ancient Greek", title: "Βάκχαι" },
  { query: "Euripides Hippolytus Prologue in Ancient Greek", title: "Ἱππόλυτος" },
  { query: "Euripides Trojan Women Prologue in Ancient Greek", title: "Τρῳάδες" },

  // Greek comedy
  { query: "Aristophanes Clouds opening in Ancient Greek", title: "Νεφέλαι" },
  { query: "Aristophanes Frogs opening in Ancient Greek", title: "Βάτραχοι" },
  { query: "Aristophanes Lysistrata Prologue in Ancient Greek", title: "Λυσιστράτη" },

  // Greek lyric
  { query: "Sappho Fragment 1 (Hymn to Aphrodite) and Fragment 31 in Ancient Greek", title: "Σαπφώ" },
  { query: "Pindar Olympian I opening in Ancient Greek", title: "Πίνδαρος — Ὀλυμπιόνικος Α'" },
  { query: "Theocritus Idyll 1 opening in Ancient Greek", title: "Θεόκριτος — Εἰδύλλιον Α'" },
  { query: "Hesiod Theogony Proem and opening in Ancient Greek", title: "Θεογονία" },
  { query: "Hesiod Works and Days opening in Ancient Greek", title: "Ἔργα καὶ Ἡμέραι" },

  // More Latin classics
  { query: "Apuleius Metamorphoses (Golden Ass) Book I opening in Latin", title: "Asinus Aureus" },
  { query: "Petronius Satyricon Cena Trimalchionis opening in Latin", title: "Satyricon" },
  { query: "Sallust Bellum Catilinae opening in Latin", title: "Bellum Catilinae" },
  { query: "Livy Ab Urbe Condita Book I preface in Latin", title: "Ab Urbe Condita" },
  { query: "Suetonius Life of Julius Caesar opening chapters in Latin", title: "Divus Iulius" },
  { query: "Pliny the Younger Epistulae Book VI Letter 16 (Vesuvius) in Latin", title: "Plinii Epistulae" },
  { query: "Boethius Consolation of Philosophy Book I in Latin", title: "Consolatio Philosophiae" },
  { query: "Vulgate Bible Gospel of John Chapter 1 in Latin", title: "Evangelium Iohannis" },
  { query: "Carmina Burana O Fortuna and selected poems in Latin", title: "Carmina Burana" },
  { query: "Propertius Elegies Book I.1 in Latin", title: "Propertii Elegiae" },
  { query: "Tibullus Elegies Book I.1 in Latin", title: "Tibulli Elegiae" },
  { query: "Martial Epigrams Book I selected in Latin", title: "Martialis Epigrammata" },
  { query: "Juvenal Satire I opening in Latin", title: "Juvenalis — Satura I" },
  { query: "Vergil Eclogue I (Tityre tu patulae) in Latin", title: "Eclogae" },
  { query: "Vergil Georgics Book I opening in Latin", title: "Georgica" },
  { query: "Plautus Aulularia opening in Latin", title: "Aulularia" },
  { query: "Terence Adelphoe Prologue in Latin", title: "Adelphoe" },

  // French drama and poetry
  { query: "Racine Phèdre Act I Scene 1 in French", title: "Phèdre" },
  { query: "Racine Andromaque Act I Scene 1 in French", title: "Andromaque" },
  { query: "Corneille Le Cid Act I Scene 1 in French", title: "Le Cid" },
  { query: "Molière Tartuffe Act I Scene 1 in French", title: "Tartuffe" },
  { query: "Molière Le Misanthrope Act I Scene 1 in French", title: "Le Misanthrope" },
  { query: "Molière L'Avare Act I Scene 1 in French", title: "L'Avare" },
  { query: "Rimbaud Le Bateau ivre and Voyelles in French", title: "Rimbaud" },
  { query: "Verlaine Chanson d'automne and Art poétique in French", title: "Verlaine" },
  { query: "Mallarmé L'après-midi d'un faune opening in French", title: "Mallarmé" },
  { query: "Ronsard Mignonne, allons voir si la rose and selected sonnets in French", title: "Ronsard" },
  { query: "Villon Ballade des dames du temps jadis in Middle French", title: "Villon" },
  { query: "La Fontaine Fables Le Corbeau et le Renard and La Cigale et la Fourmi in French", title: "Fables" },

  // French fiction
  { query: "Proust Du côté de chez Swann opening (Longtemps je me suis couché de bonne heure) in French", title: "Recherche du temps perdu" },
  { query: "Stendhal Le Rouge et le Noir Chapter 1 in French", title: "Le Rouge et le Noir" },
  { query: "Balzac Le Père Goriot opening in French", title: "Père Goriot" },
  { query: "Camus L'Étranger Part 1 Chapter 1 (Aujourd'hui maman est morte) in French", title: "L'Étranger" },
  { query: "Camus La Peste opening in French", title: "La Peste" },
  { query: "Sartre La Nausée opening in French", title: "La Nausée" },
  { query: "Zola Germinal opening in French", title: "Germinal" },
  { query: "Maupassant Boule de Suif opening in French", title: "Boule de Suif" },
  { query: "Dumas Les Trois Mousquetaires Chapter 1 in French", title: "Trois Mousquetaires" },

  // Italian poetry and fiction
  { query: "Leopardi L'infinito and A Silvia in Italian", title: "Leopardi" },
  { query: "Foscolo Dei Sepolcri opening in Italian", title: "Dei Sepolcri" },
  { query: "Foscolo A Zacinto sonnet in Italian", title: "A Zacinto" },
  { query: "Carducci Pianto antico and San Martino in Italian", title: "Carducci" },
  { query: "Pascoli Il lampo and X Agosto in Italian", title: "Pascoli" },
  { query: "Ungaretti Mattina and Soldati and Veglia in Italian", title: "Ungaretti" },
  { query: "Montale I limoni and Meriggiare pallido e assorto in Italian", title: "Montale" },
  { query: "Quasimodo Ed è subito sera and selected in Italian", title: "Quasimodo" },
  { query: "Tomasi di Lampedusa Il Gattopardo Chapter 1 opening in Italian", title: "Gattopardo" },
  { query: "Calvino Le città invisibili opening chapters in Italian", title: "Città invisibili" },
  { query: "Calvino Il barone rampante Chapter 1 in Italian", title: "Barone rampante" },
  { query: "Pavese La luna e i falò Chapter 1 in Italian", title: "Luna e i falò" },
  { query: "Pirandello Il fu Mattia Pascal Chapter 1 in Italian", title: "Fu Mattia Pascal" },
  { query: "Pirandello Sei personaggi in cerca d'autore opening in Italian", title: "Sei personaggi" },
  { query: "Verga I Malavoglia Chapter 1 in Italian", title: "Malavoglia" },
  { query: "Svevo La coscienza di Zeno Preface and Chapter 1 in Italian", title: "Coscienza di Zeno" },
  { query: "Eco Il nome della rosa Prologue in Italian", title: "Nome della rosa" },
  { query: "Levi Se questo è un uomo opening chapter in Italian", title: "Se questo è un uomo" },
  { query: "Ariosto Orlando Furioso Canto I opening in Italian", title: "Orlando Furioso" },
  { query: "Tasso Gerusalemme Liberata Canto I opening in Italian", title: "Gerusalemme Liberata" },

  // Spanish drama, poetry, fiction
  { query: "Calderón La vida es sueño Act I (Segismundo monologue) in Spanish", title: "La vida es sueño" },
  { query: "Lope de Vega Fuenteovejuna Act I in Spanish", title: "Fuenteovejuna" },
  { query: "Tirso de Molina El burlador de Sevilla Act I in Spanish", title: "Burlador de Sevilla" },
  { query: "García Lorca Romancero gitano Romance sonámbulo in Spanish", title: "Romancero gitano" },
  { query: "García Lorca Bodas de sangre Act I in Spanish", title: "Bodas de sangre" },
  { query: "Machado Campos de Castilla selected poems in Spanish", title: "Campos de Castilla" },
  { query: "Neruda Veinte poemas de amor Poema 20 in Spanish", title: "Veinte poemas" },
  { query: "Neruda Canto general Alturas de Macchu Picchu I in Spanish", title: "Canto general" },
  { query: "Borges Ficciones El Aleph opening in Spanish", title: "El Aleph" },
  { query: "Borges Ficciones Tlön Uqbar Orbis Tertius opening in Spanish", title: "Ficciones" },
  { query: "Cortázar Rayuela Chapter 1 in Spanish", title: "Rayuela" },
  { query: "Galdós Fortunata y Jacinta Chapter 1 in Spanish", title: "Fortunata y Jacinta" },
  { query: "Unamuno Niebla Chapter 1 in Spanish", title: "Niebla" },
  { query: "Quevedo Buscón opening in Spanish", title: "Buscón" },
  { query: "Góngora Soledades opening in Spanish", title: "Soledades" },
  { query: "Sor Juana Inés de la Cruz Hombres necios sonnet in Spanish", title: "Sor Juana" },

  // German drama, poetry, fiction
  { query: "Schiller Wilhelm Tell Act I Scene 1 in German", title: "Wilhelm Tell" },
  { query: "Schiller Die Räuber Act I in German", title: "Die Räuber" },
  { query: "Schiller Maria Stuart Act I Scene 1 in German", title: "Maria Stuart" },
  { query: "Lessing Nathan der Weise Act I in German", title: "Nathan der Weise" },
  { query: "Büchner Woyzeck opening scenes in German", title: "Woyzeck" },
  { query: "Brecht Mutter Courage Scene 1 in German", title: "Mutter Courage" },
  { query: "Goethe Die Leiden des jungen Werthers opening letters in German", title: "Werther" },
  { query: "Goethe Wilhelm Meisters Lehrjahre Book I Chapter 1 in German", title: "Wilhelm Meister" },
  { query: "Hölderlin Hyperions Schicksalslied and Hälfte des Lebens in German", title: "Hölderlin" },
  { query: "Rilke Duineser Elegien First Elegy in German", title: "Duineser Elegien" },
  { query: "Rilke Sonette an Orpheus selected in German", title: "Sonette an Orpheus" },
  { query: "Heine Die Lorelei and Buch der Lieder selected in German", title: "Heine" },
  { query: "Novalis Hymnen an die Nacht First Hymn in German", title: "Hymnen an die Nacht" },
  { query: "Hesse Siddhartha Chapter 1 in German", title: "Siddhartha" },
  { query: "Hesse Der Steppenwolf opening in German", title: "Steppenwolf" },
  { query: "Hoffmann Der Sandmann opening in German", title: "Sandmann" },
  { query: "Storm Der Schimmelreiter opening in German", title: "Schimmelreiter" },
  { query: "Fontane Effi Briest Chapter 1 in German", title: "Effi Briest" },
  { query: "Kafka Der Process Chapter 1 in German", title: "Der Process" },
  { query: "Kafka Das Schloss Chapter 1 in German", title: "Das Schloss" },
  { query: "Mann Der Zauberberg opening in German", title: "Zauberberg" },
  { query: "Mann Buddenbrooks Part 1 Chapter 1 in German", title: "Buddenbrooks" },

  // Medieval and additional Greek
  { query: "Beowulf opening in Old English with parallel Latin", title: "Beowulf" },
  { query: "Chanson de Roland opening laisses in Old French", title: "Chanson de Roland" },
  { query: "Nibelungenlied opening in Middle High German", title: "Nibelungenlied" },
  { query: "Erasmus Encomium Moriae (Praise of Folly) opening in Latin", title: "Encomium Moriae" },
  { query: "Thomas More Utopia Book I opening in Latin", title: "Utopia" },
  { query: "Newton Principia Mathematica Preface in Latin", title: "Principia" },
  { query: "Spinoza Ethica Part I opening definitions in Latin", title: "Ethica" },
  { query: "Descartes Meditationes de Prima Philosophia First Meditation in Latin", title: "Meditationes" },
  { query: "Longus Daphnis and Chloe Book I opening in Ancient Greek", title: "Δάφνις καὶ Χλόη" },
  { query: "Plutarch Life of Alexander opening in Ancient Greek", title: "Πλούταρχος — Ἀλέξανδρος" },
  { query: "Thucydides Histories Book I Pericles funeral oration in Ancient Greek", title: "Θουκυδίδης — Ἐπιτάφιος" },
  { query: "New Testament Gospel of John Chapter 1 in Koine Greek", title: "Κατὰ Ἰωάννην" },
  { query: "Lucian True History Book I opening in Ancient Greek", title: "Ἀληθῆ Διηγήματα" },

  // More Plato
  { query: "Plato Symposium opening (Apollodorus narrative) in Ancient Greek", title: "Συμπόσιον" },
  { query: "Plato Phaedo opening in Ancient Greek", title: "Φαίδων" },
  { query: "Plato Phaedrus opening in Ancient Greek", title: "Φαῖδρος" },
  { query: "Plato Meno opening in Ancient Greek", title: "Μένων" },
  { query: "Plato Gorgias opening in Ancient Greek", title: "Γοργίας" },
  { query: "Plato Timaeus opening in Ancient Greek", title: "Τίμαιος" },

  // Greek orators and historians
  { query: "Demosthenes On the Crown opening in Ancient Greek", title: "Περὶ τοῦ Στεφάνου" },
  { query: "Demosthenes First Philippic opening in Ancient Greek", title: "Φιλιππικὸς Α'" },
  { query: "Lysias Against Eratosthenes opening in Ancient Greek", title: "Λυσίας — Κατὰ Ἐρατοσθένους" },
  { query: "Isocrates Panegyricus opening in Ancient Greek", title: "Πανηγυρικός" },
  { query: "Polybius Histories Book I opening in Ancient Greek", title: "Πολύβιος" },
  { query: "Pausanias Description of Greece Book I (Attica) opening in Ancient Greek", title: "Παυσανίας" },

  // More Greek poetry / Hellenistic
  { query: "Apollonius Rhodius Argonautica Book I opening in Ancient Greek", title: "Ἀργοναυτικά" },
  { query: "Callimachus Hymn to Apollo opening in Ancient Greek", title: "Καλλίμαχος" },
  { query: "Anacreon selected poems in Ancient Greek", title: "Ἀνακρέων" },
  { query: "Menander Dyskolos opening in Ancient Greek", title: "Δύσκολος" },
  { query: "Bacchylides Ode V opening in Ancient Greek", title: "Βακχυλίδης" },
  { query: "Septuagint Genesis Chapter 1 in Koine Greek", title: "Γένεσις" },
  { query: "Septuagint Psalm 1 and Psalm 23 in Koine Greek", title: "Ψαλμοί" },
  { query: "New Testament Romans Chapter 1 in Koine Greek", title: "Πρὸς Ῥωμαίους" },
  { query: "New Testament 1 Corinthians 13 in Koine Greek", title: "Κορινθίους Α' 13" },
  { query: "Epictetus Enchiridion opening in Ancient Greek", title: "Ἐγχειρίδιον" },

  // More Latin classics
  { query: "Pliny the Elder Naturalis Historia Preface in Latin", title: "Naturalis Historia" },
  { query: "Quintilian Institutio Oratoria Book I opening in Latin", title: "Institutio Oratoria" },
  { query: "Statius Thebaid Book I opening in Latin", title: "Thebais" },
  { query: "Silius Italicus Punica Book I opening in Latin", title: "Punica" },
  { query: "Lucan Pharsalia Book I opening in Latin", title: "Pharsalia" },
  { query: "Valerius Maximus Memorable Doings Book I opening in Latin", title: "Facta et Dicta" },
  { query: "Aulus Gellius Noctes Atticae Preface in Latin", title: "Noctes Atticae" },
  { query: "Macrobius Saturnalia Book I opening in Latin", title: "Saturnalia" },
  { query: "Curtius Rufus Histories of Alexander Book III opening in Latin", title: "Curtius Rufus" },
  { query: "Ammianus Marcellinus Res Gestae Book XIV opening in Latin", title: "Res Gestae" },
  { query: "Vitruvius De Architectura Book I Preface in Latin", title: "De Architectura" },
  { query: "Frontinus Strategemata Book I opening in Latin", title: "Strategemata" },
  { query: "Florus Epitome Book I opening in Latin", title: "Florus" },
  { query: "Eutropius Breviarium Book I opening in Latin", title: "Breviarium" },
  { query: "Justin Epitome of Pompeius Trogus Book I opening in Latin", title: "Justinus" },
  { query: "Vulgate Bible Genesis Chapter 1 in Latin", title: "Genesis (Vulgata)" },
  { query: "Vulgate Bible Psalm 1 and Psalm 22 in Latin", title: "Psalmi" },
  { query: "Vulgate Bible Matthew Chapter 5 (Sermon on the Mount) in Latin", title: "Evangelium Matthaei" },
  { query: "Augustine De Civitate Dei Book I opening in Latin", title: "De Civitate Dei" },
  { query: "Aquinas Summa Theologiae Prima Pars Question 1 in Latin", title: "Summa Theologiae" },
  { query: "Anselm Proslogion Chapter 1-3 (ontological argument) in Latin", title: "Proslogion" },
  { query: "Bernard of Clairvaux Sermons on Song of Songs Sermon 1 in Latin", title: "Sermones in Cantica" },
  { query: "Bede Historia Ecclesiastica Book I opening in Latin", title: "Historia Ecclesiastica" },
  { query: "Tertullian Apologeticus opening in Latin", title: "Apologeticus" },
  { query: "Lactantius Divinae Institutiones Book I opening in Latin", title: "Divinae Institutiones" },
  { query: "Jerome Letter 22 to Eustochium opening in Latin", title: "Hieronymi Epistula 22" },
  { query: "Galileo Sidereus Nuncius opening in Latin", title: "Sidereus Nuncius" },
  { query: "Francis Bacon Novum Organum Aphorisms Book I opening in Latin", title: "Novum Organum" },
  { query: "Leibniz Monadologia opening sections in Latin", title: "Monadologia" },

  // French — more drama, philosophy, fiction, poetry
  { query: "Chrétien de Troyes Yvain opening in Old French", title: "Yvain" },
  { query: "Marie de France Lais — Lai du Lanval opening in Old French", title: "Lais" },
  { query: "Rabelais Gargantua Chapter 1 prologue in French", title: "Gargantua" },
  { query: "Montaigne Essais Book I Chapter 1 in French", title: "Essais" },
  { query: "Rousseau Les Confessions Book I opening in French", title: "Confessions (Rousseau)" },
  { query: "Rousseau Du contrat social Book I opening in French", title: "Contrat social" },
  { query: "Diderot Le Neveu de Rameau opening in French", title: "Neveu de Rameau" },
  { query: "Beaumarchais Le Mariage de Figaro Act I Scene 1 in French", title: "Mariage de Figaro" },
  { query: "Hugo Les Contemplations 'Demain dès l'aube' and selected in French", title: "Contemplations" },
  { query: "Lamartine Méditations poétiques 'Le Lac' in French", title: "Le Lac" },
  { query: "Musset La Nuit de Mai in French", title: "Nuit de Mai" },
  { query: "Vigny La Mort du loup in French", title: "Mort du loup" },
  { query: "Apollinaire Alcools 'Le Pont Mirabeau' and 'Zone' opening in French", title: "Alcools" },
  { query: "Éluard Liberté in French", title: "Liberté" },
  { query: "Char Feuillets d'Hypnos selected in French", title: "Feuillets d'Hypnos" },
  { query: "Gide Les Faux-monnayeurs Chapter 1 in French", title: "Faux-monnayeurs" },
  { query: "Mauriac Thérèse Desqueyroux Chapter 1 in French", title: "Thérèse Desqueyroux" },
  { query: "Yourcenar Mémoires d'Hadrien opening in French", title: "Mémoires d'Hadrien" },
  { query: "Duras L'Amant opening in French", title: "L'Amant" },
  { query: "Beckett En attendant Godot Act I opening in French", title: "Godot" },
  { query: "Ionesco La Cantatrice chauve Scene 1 in French", title: "Cantatrice chauve" },
  { query: "Verne Vingt mille lieues sous les mers Chapter 1 in French", title: "Vingt mille lieues" },
  { query: "Saint-Exupéry Vol de nuit Chapter 1 in French", title: "Vol de nuit" },

  // Italian — more poetry and fiction
  { query: "D'Annunzio La pioggia nel pineto in Italian", title: "Pioggia nel pineto" },
  { query: "Saba Trieste and Mio padre è stato per me l'assassino in Italian", title: "Saba" },
  { query: "Pirandello Uno, nessuno e centomila Book I Chapter 1 in Italian", title: "Uno, nessuno e centomila" },
  { query: "Moravia Gli indifferenti Chapter 1 in Italian", title: "Indifferenti" },
  { query: "Morante La Storia opening in Italian", title: "La Storia" },
  { query: "Bassani Il giardino dei Finzi-Contini Prologue in Italian", title: "Finzi-Contini" },
  { query: "Sciascia Il giorno della civetta opening in Italian", title: "Giorno della civetta" },
  { query: "Buzzati Il deserto dei Tartari Chapter 1 in Italian", title: "Deserto dei Tartari" },
  { query: "Calvino Se una notte d'inverno un viaggiatore Chapter 1 in Italian", title: "Se una notte d'inverno" },
  { query: "Ginzburg Lessico famigliare opening in Italian", title: "Lessico famigliare" },
  { query: "Ferrante L'amica geniale Prologue in Italian", title: "Amica geniale" },
  { query: "Tabucchi Sostiene Pereira Chapter 1 in Italian", title: "Sostiene Pereira" },
  { query: "Boiardo Orlando Innamorato Canto I opening in Italian", title: "Orlando Innamorato" },
  { query: "Goldoni La locandiera Act I Scene 1 in Italian", title: "Locandiera" },
  { query: "Alfieri Saul Act I opening in Italian", title: "Saul" },

  // Spanish — more poetry, drama, fiction, mystical
  { query: "Cervantes Novelas ejemplares El licenciado Vidriera opening in Spanish", title: "Licenciado Vidriera" },
  { query: "Mateo Alemán Guzmán de Alfarache Part I Book I Chapter 1 in Spanish", title: "Guzmán de Alfarache" },
  { query: "Teresa de Ávila Libro de la vida Chapter 1 in Spanish", title: "Vida de Teresa" },
  { query: "San Juan de la Cruz Noche oscura del alma poem in Spanish", title: "Noche oscura" },
  { query: "Fray Luis de León Vida retirada in Spanish", title: "Vida retirada" },
  { query: "Pardo Bazán Los Pazos de Ulloa Chapter 1 in Spanish", title: "Pazos de Ulloa" },
  { query: "Valle-Inclán Luces de bohemia Scene 1 in Spanish", title: "Luces de bohemia" },
  { query: "Azorín Castilla opening in Spanish", title: "Castilla" },
  { query: "Cela La familia de Pascual Duarte Chapter 1 in Spanish", title: "Pascual Duarte" },
  { query: "Delibes Cinco horas con Mario opening in Spanish", title: "Cinco horas con Mario" },
  { query: "Marsé Últimas tardes con Teresa Chapter 1 in Spanish", title: "Últimas tardes con Teresa" },
  { query: "Vargas Llosa La ciudad y los perros Chapter 1 in Spanish", title: "La ciudad y los perros" },
  { query: "Allende La casa de los espíritus Chapter 1 in Spanish", title: "Casa de los espíritus" },
  { query: "Rulfo Pedro Páramo opening in Spanish", title: "Pedro Páramo" },
  { query: "Asturias El Señor Presidente Chapter 1 in Spanish", title: "Señor Presidente" },
  { query: "Paz Piedra de sol opening in Spanish", title: "Piedra de sol" },
  { query: "Vallejo Trilce Poema I and Los heraldos negros in Spanish", title: "Trilce" },
  { query: "Storni Tú me quieres blanca and selected in Spanish", title: "Alfonsina Storni" },
  { query: "Mistral Sonetos de la muerte in Spanish", title: "Sonetos de la muerte" },
  { query: "Jiménez Platero y yo opening in Spanish", title: "Platero y yo" },
  { query: "Hernández selected sonnets El rayo que no cesa in Spanish", title: "Miguel Hernández" },

  // German — more poetry, drama, philosophy, fiction
  { query: "Eichendorff Aus dem Leben eines Taugenichts Chapter 1 in German", title: "Taugenichts" },
  { query: "Tieck Der blonde Eckbert opening in German", title: "Blonde Eckbert" },
  { query: "Mörike Mozart auf der Reise nach Prag opening in German", title: "Mozart auf der Reise" },
  { query: "Droste-Hülshoff Die Judenbuche opening in German", title: "Judenbuche" },
  { query: "Keller Romeo und Julia auf dem Dorfe opening in German", title: "Romeo und Julia auf dem Dorfe" },
  { query: "C.F. Meyer Die Versuchung des Pescara Chapter 1 in German", title: "Pescara" },
  { query: "Wieland Geschichte des Agathon Chapter 1 in German", title: "Agathon" },
  { query: "Hofmannsthal Der Tor und der Tod opening in German", title: "Tor und der Tod" },
  { query: "Trakl Grodek and Verfall and selected in German", title: "Trakl" },
  { query: "Benn Selbstbildnis and selected in German", title: "Benn" },
  { query: "Celan Todesfuge in German", title: "Todesfuge" },
  { query: "Bachmann Anrufung des Großen Bären and selected in German", title: "Bachmann" },
  { query: "Grass Die Blechtrommel Chapter 1 in German", title: "Blechtrommel" },
  { query: "Böll Ansichten eines Clowns Chapter 1 in German", title: "Ansichten eines Clowns" },
  { query: "Walser Der Spaziergang opening in German", title: "Spaziergang" },
  { query: "Stifter Bergkristall opening in German", title: "Bergkristall" },
  { query: "Grimm Die Märchen Hänsel und Gretel and Rotkäppchen in German", title: "Grimms Märchen" },
  { query: "Schopenhauer Die Welt als Wille und Vorstellung Preface in German", title: "Welt als Wille" },
  { query: "Nietzsche Die Geburt der Tragödie Section 1 in German", title: "Geburt der Tragödie" },
  { query: "Nietzsche Jenseits von Gut und Böse Preface in German", title: "Jenseits von Gut und Böse" },
  { query: "Kant Kritik der reinen Vernunft Preface in German", title: "Kritik der reinen Vernunft" },
  { query: "Marx Das Kapital Vorwort (Preface) in German", title: "Das Kapital" },
  { query: "Freud Die Traumdeutung Introduction in German", title: "Traumdeutung" },
  { query: "Wittgenstein Tractatus Logico-Philosophicus opening propositions in German", title: "Tractatus" },

  // Dostoevsky (1821-1881) — additional chapters beyond the early-Russian entries above
  { query: "Dostoevsky Преступление и наказание (Crime and Punishment) Part 1 Chapter 2 in Russian", title: "Преступление и наказание — II" },
  { query: "Dostoevsky Братья Карамазовы (Brothers Karamazov) Book 1 Chapter 1 in Russian", title: "Братья Карамазовы — I" },
  { query: "Dostoevsky Братья Карамазовы (Brothers Karamazov) Book 5 Chapter 5 — The Grand Inquisitor in Russian", title: "Великий инквизитор" },
  { query: "Dostoevsky Идиот (The Idiot) Part 1 Chapter 1 in Russian", title: "Идиот — I" },
  { query: "Dostoevsky Бесы (Demons) Part 1 Chapter 1 in Russian", title: "Бесы — I" },
  { query: "Dostoevsky Записки из подполья (Notes from Underground) Part 1 Chapter 1 in Russian", title: "Записки из подполья — I" },
  { query: "Dostoevsky Белые ночи (White Nights) First Night in Russian", title: "Белые ночи" },
  { query: "Dostoevsky Игрок (The Gambler) Chapter 1 in Russian", title: "Игрок — I" },
  { query: "Dostoevsky Униженные и оскорблённые (The Insulted and Humiliated) Part 1 Chapter 1 in Russian", title: "Униженные и оскорблённые — I" },
];

async function catalogKeyExists(key: string): Promise<boolean> {
  const [row] = await db
    .select({ id: textsTable.id })
    .from(textsTable)
    .where(eq(textsTable.catalogKey, key))
    .limit(1);
  return !!row;
}

async function fetchAndStore(
  query: string,
  catalogTitle: string,
  nationality?: "British" | "American"
): Promise<void> {
  // Dedup by stable catalogKey, NOT by AI-returned title (which varies per call).
  if (await catalogKeyExists(catalogTitle)) {
    logger.info({ catalogTitle }, "Catalog text already in DB, skipping");
    return;
  }

  const result = await searchAndFetchText(query);

  // Re-check after AI call to guard against concurrent inserts
  if (await catalogKeyExists(catalogTitle)) {
    logger.info({ title: result.title, catalogTitle }, "Skipping duplicate catalog text");
    return;
  }

  const [text] = await db
    .insert(textsTable)
    .values({
      title: result.title,
      author: result.author,
      language: result.language,
      targetLanguage: "English",
      sourceUrl: result.sourceUrl,
      description: result.description,
      publicationYear: result.publicationYear ?? null,
      englishTitle: result.englishTitle ?? null,
      englishAuthor: result.englishAuthor ?? null,
      catalogKey: catalogTitle,
      nationality: nationality ?? null,
      paragraphCount: result.paragraphs.length,
      // Do not set lastAccessedAt — only user-initiated reads should set this
    })
    .returning();

  const paragraphInserts = result.paragraphs.map((p, i) => ({
    textId: text.id,
    index: i,
    originalText: p,
  }));

  await db.insert(paragraphsTable).values(paragraphInserts);
  logger.info({ title: result.title }, "Seeded catalog text");

  // Pre-warm the first paragraph's interlinear so reading starts instantly.
  // Yield to foreground requests first; failures are non-fatal.
  try {
    await waitForIdleForeground(4000);
    const [first] = await db
      .select()
      .from(paragraphsTable)
      .where(and(eq(paragraphsTable.textId, text.id), eq(paragraphsTable.index, 0)));
    if (first && !first.interlinearTranslation) {
      const words = await generateInterlinearTranslation(
        first.originalText,
        text.language,
        text.targetLanguage ?? "English"
      );
      await db
        .update(paragraphsTable)
        .set({ interlinearTranslation: JSON.stringify(words) })
        .where(eq(paragraphsTable.id, first.id));
    }
  } catch (err) {
    logger.warn({ err, title: result.title }, "Failed to pre-warm interlinear");
  }
}

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<void> {
  const queue = [...tasks];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      // Yield to user-initiated requests: pause seeding while any foreground
      // request is in flight (e.g. /texts/search) and for a short quiet window after.
      await waitForIdleForeground(4000);
      const task = queue.shift();
      if (task) await task();
    }
  });
  await Promise.all(workers);
}

export async function seedCatalog(): Promise<void> {
  const missing: Array<{ query: string; title: string; nationality?: "British" | "American" }> = [];

  for (const item of CATALOG_QUERIES) {
    if (!(await catalogKeyExists(item.title))) {
      missing.push(item);
    }
  }

  if (missing.length === 0) {
    logger.info("Catalog already seeded — nothing to do");
    return;
  }

  logger.info({ count: missing.length }, "Seeding catalog texts in background");

  const tasks = missing.map(
    (c) => () =>
      fetchAndStore(c.query, c.title, c.nationality).catch((err) => {
        logger.error({ err, query: c.query }, "Failed to seed catalog text");
      })
  );

  runWithConcurrency(tasks, 1).catch((err) => {
    logger.error({ err }, "Catalog seed failed");
  });
}
