import { ilike, eq, and } from "drizzle-orm";
import { db, textsTable, paragraphsTable } from "@workspace/db";
import { searchAndFetchText, generateInterlinearTranslation } from "./ai";
import { logger } from "./logger";
import { waitForIdleForeground } from "./foregroundGate";

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

  runWithConcurrency(tasks, 1).catch((err) => {
    logger.error({ err }, "Catalog seed failed");
  });
}
