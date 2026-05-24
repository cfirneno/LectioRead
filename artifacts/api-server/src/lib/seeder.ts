import { ilike } from "drizzle-orm";
import { db, textsTable, paragraphsTable } from "@workspace/db";
import { searchAndFetchText } from "./ai";
import { logger } from "./logger";

const CATALOG_QUERIES: Array<{ query: string; title: string }> = [
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
];

async function titleExistsInDb(partialTitle: string): Promise<boolean> {
  const [row] = await db
    .select({ id: textsTable.id })
    .from(textsTable)
    .where(ilike(textsTable.title, `%${partialTitle}%`))
    .limit(1);
  return !!row;
}

async function fetchAndStore(query: string, catalogTitle: string): Promise<void> {
  // Check before calling AI using a keyword from the catalog title to handle
  // minor title format variations the AI might return
  if (await titleExistsInDb(catalogTitle)) {
    logger.info({ catalogTitle }, "Catalog text already in DB, skipping");
    return;
  }

  const result = await searchAndFetchText(query);

  // Check again after AI call to guard against concurrent inserts
  if (await titleExistsInDb(catalogTitle)) {
    logger.info({ title: result.title }, "Skipping duplicate catalog text");
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
}

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<void> {
  const queue = [...tasks];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const task = queue.shift();
      if (task) await task();
    }
  });
  await Promise.all(workers);
}

export async function seedCatalog(): Promise<void> {
  const missing: Array<{ query: string; title: string }> = [];

  for (const item of CATALOG_QUERIES) {
    if (!(await titleExistsInDb(item.title))) {
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
      fetchAndStore(c.query, c.title).catch((err) => {
        logger.error({ err, query: c.query }, "Failed to seed catalog text");
      })
  );

  runWithConcurrency(tasks, 2).catch((err) => {
    logger.error({ err }, "Catalog seed failed");
  });
}
