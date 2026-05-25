import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Languages, Layers, ArrowRight, GraduationCap, Sparkles } from "lucide-react";

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
            <Link href="/sign-up">
              <Button className="font-serif">Get started</Button>
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/sign-up">
              <Button size="lg" className="font-serif text-base h-12 px-8">
                Start reading — $1/month
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="ghost" className="font-serif text-base h-12">
                I already have an account
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground pt-2">
            Cancel anytime. No free trial — just a real, low price.
          </p>
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
            One dollar a month
          </h2>
          <p className="text-muted-foreground font-serif max-w-xl mx-auto">
            Lectio is supported by a single, honest price — about the cost of a
            postcard. No ads, no tracking, no dark patterns. Cancel from your
            account at any time.
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
