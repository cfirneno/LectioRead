import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Languages, Layers, GraduationCap, Sparkles, ChevronDown } from "lucide-react";

function scrollToWhyOriginal() {
  document.getElementById("why-original")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const LAOCOON_LINES: Array<Array<{ la: string; en: string }>> = [
  [
    { la: "ille", en: "he" },
    { la: "simul", en: "at once" },
    { la: "manibus", en: "with his hands" },
    { la: "tendit", en: "strives" },
    { la: "dīvellere", en: "to tear apart" },
    { la: "nōdōs", en: "the knots" },
  ],
  [
    { la: "perfūsus", en: "drenched" },
    { la: "saniē", en: "with gore" },
    { la: "vittās", en: "his fillets" },
    { la: "ātrōque", en: "and with black" },
    { la: "venēnō", en: "venom" },
  ],
  [
    { la: "illum", en: "him" },
    { la: "eōdem", en: "with the same" },
    { la: "flātū", en: "breath" },
    { la: "tepefacta", en: "warmed" },
    { la: "per", en: "through" },
    { la: "ōra", en: "mouths" },
  ],
  [
    { la: "cruentō", en: "with bloody" },
    { la: "expulsa", en: "driven out" },
    { la: "caede", en: "slaughter" },
    { la: "recessit", en: "withdrew" },
  ],
];

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="border-b border-border/40">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif text-2xl font-semibold text-primary">
            <BookOpen className="h-6 w-6" />
            <span>Lectio</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <Button variant="ghost" className="font-serif">Sign in</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-16 md:py-24 space-y-20">
        <section className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-serif font-semibold text-primary tracking-tight leading-tight">
            Read the originals.
            <br />
            One paragraph at a time.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-serif max-w-2xl mx-auto leading-relaxed">
            Lectio is a structured reader for the great books in their original languages —
            Latin, Greek, Italian, French, German, Spanish, Russian, and Japanese.
            Built for students and lifelong readers who want to meet Virgil, Homer, Dante,
            Tolstoy, and Sōseki on their own terms.
          </p>
          <button
            onClick={scrollToWhyOriginal}
            className="group mx-auto mt-16 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            aria-label="Scroll to Why in the original"
          >
            <span className="font-serif text-sm tracking-wide uppercase">
              Why in the original
            </span>
            <ChevronDown className="h-6 w-6 animate-bounce group-hover:text-primary" />
          </button>
        </section>

        <section className="border-t border-border/40 pt-16 space-y-8 text-center">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground font-serif text-sm">
              <GraduationCap className="h-4 w-4" />
              For high school &amp; college students
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-primary tracking-tight">
            Whether it's for class — or for the love of it.
          </h2>
          <div className="max-w-2xl mx-auto text-left space-y-4 text-muted-foreground font-serif text-base md:text-lg leading-relaxed">
            <p>
              Working through Virgil for AP Latin? Reading the Iliad for a Greek
              seminar? Preparing translation passages for an exam? Lectio gives you
              the original text alongside a careful word-by-word gloss and a
              full translation — so you can prep faster, check your own
              rendering, and actually understand what you're reading.
            </p>
            <p>
              Or maybe there's no assignment at all. Maybe you just want to read
              Anna Karenina in Russian, or Kokoro in Japanese, the way the author
              wrote it. Lectio makes that possible too — a quiet, beautiful place
              to spend twenty minutes a day with the books that matter.
            </p>
          </div>
        </section>

        <section id="why-original" className="border-t border-border/40 pt-16 space-y-6 scroll-mt-20">
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-primary tracking-tight text-center">
            Why the original matters.
          </h2>
          <div className="max-w-2xl mx-auto space-y-5 text-muted-foreground font-serif text-base md:text-lg leading-relaxed">
            <p>
              You don't have to be a scholar to read the great works in their own
              language. Even a slow, halting first encounter — original on one
              side, translation on the other — gives you something no
              translation alone can: the actual shape of the author's mind.
            </p>
            <p>
              Take the death of Laocoön in Book II of the Aeneid. Virgil
              writes:
            </p>
            <div className="border-l-2 border-primary/40 pl-5 py-2 space-y-5">
              {LAOCOON_LINES.map((line, li) => (
                <div key={li} className="flex flex-wrap gap-x-5 gap-y-3">
                  {line.map((word, wi) => (
                    <div key={wi} className="flex flex-col items-start">
                      <span className="font-serif italic text-foreground text-lg md:text-xl leading-tight">
                        {word.la}
                      </span>
                      <span className="font-sans text-xs md:text-sm text-primary tracking-wide mt-0.5">
                        {word.en}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
              <p className="text-sm not-italic text-muted-foreground pt-1">
                (...two serpents coil around Laocoön and his sons, their bodies
                literally wound through the line itself.)
              </p>
            </div>
            <p>
              Because Latin is inflected — every noun and adjective marked for
              case, number, and gender by its ending — Virgil could place the
              words almost anywhere he wanted and still have the sentence make
              sense. So he <em>snakes</em> the modifiers around their nouns the
              way the serpents snake around their victims. Look at the pairs
              the endings lock together:
            </p>
            <ul className="list-none pl-0 space-y-1 text-base">
              <li>
                <em>perfūsus … vittās</em> — "drenched … fillets" (the
                participle reaches across two words to its noun)
              </li>
              <li>
                <em>ātrō … venēnō</em> — "black … venom" (adjective and noun
                separated by <em>vittās</em>, which they wrap around)
              </li>
              <li>
                <em>eōdem … flātū</em> — "with the same … breath" (split by
                <em> tepefacta per ōra</em>)
              </li>
              <li>
                <em>cruentō … caede</em> — "with bloody … slaughter" (wrapped
                around <em>expulsa</em>)
              </li>
            </ul>
            <p>
              The matching endings (<em>-us / -ās</em>, <em>-ō / -ō</em>,
              <em> -em / -ū</em>, <em>-ō / -e</em>) tell the reader which words
              belong together, no matter how far apart they sit. The grammar
              enacts the horror. In English you can describe the scene; in
              Latin you watch it happen on the page.
            </p>
            <p>
              And then Virgil closes the knot. The final word — <em>recessit</em>,
              "withdrew" — is a third-person singular perfect, a single verb
              that gathers every loose strand of the sentence into one
              completed action. The breath (<em>flātū</em>) that warmed the
              mouths, the slaughter (<em>caede</em>) that drove the serpent
              out, the venom (<em>venēnō</em>) and the gore (<em>saniē</em>)
              — all of them resolve into that one perfect tense at the end of
              the line. The coils that have been winding through four lines
              of hyperbaton finally release, and the snake slips away on the
              same syllable the sentence does.<sup>1</sup>
            </p>
            <p className="text-sm text-muted-foreground/80 border-t border-border/30 pt-3">
              <sup>1</sup> The reading above — both the four linked pairs and
              the closing observation on <em>recessit</em> as the verb in
              which the snake's coils finally release — follows a line-by-line
              analysis given by W. R. ("Ralph") Johnson in a two-person
              seminar on the Aeneid, University of Chicago, Fall 1982. With
              gratitude to Dr. Johnson and to my fellow student that term,
              the poet Vincent Katz — to whom this little corner of the page
              is dedicated.
            </p>
            <p>
              That's what reading in the original gives you, and it's why even
              an imperfect attempt is worth the effort. Lectio is built to
              make that attempt worthwhile.
            </p>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-8 border-t border-border/40 pt-16">
          <div className="space-y-2">
            <Layers className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-lg font-semibold">Five-stage cycle</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Each paragraph cycles through original, interlinear gloss, side-by-side
              translation, and back to the original — until you've internalized it.
            </p>
          </div>
          <div className="space-y-2">
            <Languages className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-lg font-semibold">Word-by-word gloss</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              See a precise English equivalent under every word. No dictionary
              breaks the rhythm of your reading — and for Latin and Greek verse,
              optional macrons and scansion marks help you hear the meter.
            </p>
          </div>
          <div className="space-y-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-lg font-semibold">A curated library</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hundreds of public-domain classics across eight languages, organized
              by author and date — plus the ability to search for any other
              public-domain work you want to read.
            </p>
          </div>
        </section>

        <section className="border-t border-border/40 pt-16 space-y-6 text-center">
          <div className="flex justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-serif font-semibold text-primary">
            Support the site
          </h2>
          <p className="text-muted-foreground font-serif max-w-xl mx-auto">
            Lectio is supported entirely by its readers — $1 a month, no ads,
            no tracking, no investors. Every subscription goes directly into
            adding more works, more languages, and new features like scansion,
            grammar notes, and audio. Cancel from your account at any time.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="font-serif">
              Create your account
            </Button>
          </Link>
        </section>
      </main>

      <footer className="border-t border-border/40 mt-20">
        <div className="container max-w-5xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground font-serif">
          Lectio · lectioread.com
        </div>
      </footer>
    </div>
  );
}
