// texts.js
// Your reading catalog. `tier: "free"` is readable by anyone (this is your
// marketing — the part that gets shared and ranks in search).
// `tier: "paid"` requires an active subscription.
//
// Replace the sample passages with however Lectio actually stores text.
// The only thing the gate cares about is the `tier` field.

module.exports = [
  {
    slug: "aeneid-1",
    author: "Virgil",
    title: "Aeneid, Book I (opening)",
    language: "Latin",
    tier: "free",
    lines: [
      ["Arma virumque canō, Trōiae quī prīmus ab ōrīs", "I sing of arms and the man, who first from the shores of Troy"],
      ["Ītaliam fātō profugus Lāvīniaque vēnit", "came, exiled by fate, to Italy and the Lavinian"],
      ["lītora, multum ille et terrīs iactātus et altō", "shores — much buffeted he was, on land and on the deep"],
      ["vī superum, saevae memorem Iūnōnis ob īram", "by the power of the gods, through cruel Juno's unforgetting wrath"],
    ],
  },
  {
    slug: "john-1-greek",
    author: "Evangelium secundum Ioannem",
    title: "John 1:1–5 (Greek)",
    language: "Koine Greek",
    tier: "free",
    lines: [
      ["Ἐν ἀρχῇ ἦν ὁ λόγος,", "In the beginning was the Word,"],
      ["καὶ ὁ λόγος ἦν πρὸς τὸν θεόν,", "and the Word was with God,"],
      ["καὶ θεὸς ἦν ὁ λόγος.", "and the Word was God."],
    ],
  },
  {
    slug: "aeneid-1-full",
    author: "Virgil",
    title: "Aeneid, Book I (complete)",
    language: "Latin",
    tier: "paid",
    lines: [["[full 756-line text with interlinear apparatus]", "[unlocked for subscribers]"]],
  },
  {
    slug: "catullus-collection",
    author: "Catullus",
    title: "Carmina (complete)",
    language: "Latin",
    tier: "paid",
    lines: [["[complete Catullus with five-stage reading cycle]", "[unlocked for subscribers]"]],
  },
];
