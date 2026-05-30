# Iliad Intro — Scene Manifest (authoritative)

This is a narrated cinematic video introducing the opening of Homer's **Iliad** for a
classical-language learning app (Lectio). A continuous narration track already exists and is
the master clock. **You must build exactly 10 scene components whose on-screen content matches
the narration and whose internal animation fits within each scene's fixed duration.**

## Hard constraints (do NOT violate)

- Create exactly these files, each a **named export** `export function SceneN()`:
  `src/components/video/video_scenes/Scene1.tsx` … `Scene10.tsx`.
- Each scene component takes **no props**. Use the same pattern as the existing scene files
  (framer-motion `motion.div` root with `initial`/`animate`/`exit`, internal `phase` state via
  `setTimeout` for timing beats). Study the existing `Scene1.tsx`…`Scene10.tsx` in that folder
  (they are placeholders from another video) for the exact interface, then REPLACE their contents.
- **Do NOT** modify, read-and-edit, or even open: `VideoTemplate.tsx`, `VideoWithControls.tsx`,
  `useSceneControls.ts`, anything under `src/lib/`, `index.css`, `index.html`, or anything in
  `public/audio/`. Durations, audio, fonts, and controls are already finalized. Touch ONLY the
  10 scene files and `public/images/`.
- Reference images with `` `${import.meta.env.BASE_URL}images/<name>.png` `` (BASE_URL includes a
  trailing slash). Generate images into `artifacts/lectio-iliad-intro/public/images/`.
- Generate all images at aspect ratio **16:9**.
- Greek text MUST use the display serif: className `font-display` (this is EB Garamond, full
  polytonic Greek). English captions can use `font-display` (serif) or `font-body` (sans).
  Render the polytonic Greek EXACTLY as written below (accents/breathings matter).

## Design language (match the existing Lectio videos)

- Palette (Tailwind tokens already defined): `bg-bg-dark` (#050505 near-black) background,
  `text-text-inverse` (off-white) text, `text-primary`/`bg-primary` (#8C1C13 deep blood-red),
  `text-secondary` (#D4AF37 antique gold) for accents/eyebrows, `text-text-muted` for secondary.
- Mood: cinematic, reverent, classical, "prestige documentary." Slow, deliberate motion;
  generous negative space; subtle Ken-Burns drift on background images; gold hairline rules;
  letter-spaced uppercase eyebrows. Greek lines large and centered as the hero element.
- Each scene = a full-bleed background image (darkened with overlays so text stays legible) +
  animated typography. Add gradient/vignette/`mix-blend` overlays so white text is always readable.

## Per-scene spec

Durations are FIXED (ms). Time your internal `setTimeout` beats to comfortably fit; leave the
final ~1s settled (no exit mid-word). Narration is given so you match the visual beat to the
words — the matching on-screen text is what the viewer should read.

### Scene1 — 16800ms — narration: "Three thousand years ago, the first great poem of the Western world began not with a hero, and not with a battle, but with a single, burning word."
- On-screen: slow build in darkness. A small eyebrow `THREE THOUSAND YEARS AGO` (gold, tracked),
  then a line resolves: *"The first poem of the West began with a single word."* Keep it sparse.
- Image: glowing embers / drifting ash in deep black, one ember brightening. (e.g. `embers.png`)

### Scene2 — 10900ms — narration: "That word was wrath. In the original Greek, mênis — a rage so fierce it belongs to the gods."
- On-screen: the English word **WRATH** appears large; beneath it the Greek **μῆνις** with a small
  romanization *mênis*. A line: *"a rage so fierce it belongs to the gods."*
- Image: reuse embers / fiery red ember texture.

### Scene3 — 14800ms — narration: "The poem is the Iliad. Its author we call Homer. Its subject is the rage of one man, and the ruin it brought to thousands."
- On-screen: the title **ΙΛΙΑΣ** large (font-display), with `HOMER · THE ILIAD` eyebrow and a
  gold hairline. Then a line: *"the rage of one man — and the ruin it brought to thousands."*
- Image: an ancient Greek bard (Homer) with a lyre by candlelight, OR the walls of Troy at dusk.
  (e.g. `homer.png` and/or `troy.png`)

### Scene4 — 9000ms — narration (Greek read aloud): "Μῆνιν ἄειδε, θεά, Πηληϊάδεω Ἀχιλῆος."
- On-screen: THE HERO MOMENT. The full opening line, large and centered, words fading in in time
  with the recitation:  **Μῆνιν ἄειδε, θεά, Πηληϊάδεω Ἀχιλῆος**
- Image: an ethereal muse/goddess silhouette in a starlit dark sky, or abstract celestial dark.
  (e.g. `muse.png`)

### Scene5 — 9800ms — narration: "Sing, O goddess, the wrath of Achilles, son of Peleus."
- On-screen: the Greek line now small/dim at top; the English translation large and centered:
  *"Sing, O goddess, of the wrath of Achilles, son of Peleus."*
- Image: reuse the muse/celestial image from Scene4 (continuity).

### Scene6 — 14500ms — narration: "The very first word is mênin — wrath. Homer places it first, so that anger itself, and not the man, becomes the true subject of the tale."
- On-screen: show the line **Μῆνιν** ἄειδε, θεά… with the FIRST word **Μῆνιν** pulled out / glowing
  gold while the rest dims; a label **Μῆνιν — "wrath"**. Then: *"Anger itself is the true hero."*
- Image: reuse embers / red glow.

### Scene7 — 14900ms — narration: "This wrath, he tells us, sent countless brave souls down to the house of Hades, and left their bodies as carrion for the dogs and the birds."
- On-screen: Greek **πολλὰς δ᾽ ἰφθίμους ψυχὰς Ἄϊδι προΐαψεν** with English beneath:
  *"and sent many mighty souls down to Hades."*
- Image: ghostly shades/souls descending into a dark underworld, cold and spectral. (e.g. `hades.png`)

### Scene8 — 13900ms — narration: "It all began with a quarrel — between Achilles, the greatest of the Greek warriors, and Agamemnon, the proud king who led them."
- On-screen: two names facing off: **Ἀχιλλεύς** (label *Achilles*) vs **Ἀγαμέμνων** (label
  *Agamemnon*), a gold divider between them, tension. A line: *"a quarrel over honor."*
- Image: two bronze-armored warriors confronting each other, firelit, charged standoff. (e.g. `quarrel.png`)

### Scene9 — 13400ms — narration: "Insulted, Achilles laid down his arms and withdrew from the war. And without him, the Greeks began to fall."
- On-screen: caption *"Achilles withdraws — and the Greeks begin to fall."* (English; this is host
  commentary, no required Greek line).
- Image: a lone warrior turning away from battle beside the beached Greek ships at dusk. (e.g. `withdraw.png`)

### Scene10 — 13500ms — narration: "And this is only the beginning. From that single word — wrath — flows the whole tragedy of Troy."
- On-screen: closing reprise. The title **ΙΛΙΑΣ** returns, with the faint full opening line and a
  closing line: *"From a single word — wrath — flows the whole tragedy of Troy."* End settled and
  calm (an end-screen call-to-action overlay fades in afterward, handled elsewhere — leave the
  final frame uncluttered and centered).
- Image: reuse embers/title treatment, or the walls of Troy.

## Image list (generate at 16:9; you may add/merge as your design needs)
- `embers.png` — glowing embers and drifting ash in deep black, one bright ember (used 1,2,6,10)
- `homer.png` — ancient Greek bard / Homer with a lyre, candlelit, classical oil-painting feel
- `troy.png` — the great walls of Troy at dusk, silhouetted, smoke (optional, 3/10)
- `muse.png` — ethereal muse / goddess silhouette in a starlit dark sky (4,5)
- `hades.png` — spectral shades/souls descending into a dark underworld
- `quarrel.png` — two bronze-armored Greek warriors in a charged firelit standoff
- `withdraw.png` — a lone warrior by the beached Greek ships at dusk, turning from battle

After writing all 10 scenes and generating images, run `bash scripts/validate-recording.sh`
from the artifact dir and fix anything it flags. Do not restart workflows (the main agent does that).
