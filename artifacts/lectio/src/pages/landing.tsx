import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Languages, Layers, ArrowRight } from "lucide-react";

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
          <p className="text-lg md:text-xl text-muted-foreground font-serif max-w-xl mx-auto leading-relaxed">
            Lectio is a structured reader for Latin, Greek, Italian, French, German, and Spanish.
            Work through Caesar, Dante, Homer, Cervantes — slowly, word by word, in their own language.
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

        <section className="grid md:grid-cols-3 gap-8 border-t border-border/40 pt-16">
          <div className="space-y-2">
            <Layers className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-lg font-semibold">Five-stage cycle</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Each paragraph cycles through original, interlinear gloss, side-by-side translation,
              and back to the original — until you've internalized it.
            </p>
          </div>
          <div className="space-y-2">
            <Languages className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-lg font-semibold">Word-by-word gloss</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hover under any word to see a precise English equivalent. No dictionary breaks
              the rhythm of your reading.
            </p>
          </div>
          <div className="space-y-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-lg font-semibold">Public-domain classics</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A curated library of the texts worth a lifetime — and the ability to search any
              public-domain work you want.
            </p>
          </div>
        </section>

        <section className="border-t border-border/40 pt-16 space-y-6 text-center">
          <h2 className="text-3xl font-serif font-semibold text-primary">
            One dollar a month
          </h2>
          <p className="text-muted-foreground font-serif max-w-xl mx-auto">
            Lectio is supported by a single, honest price — about the cost of a postcard. No ads,
            no tracking, no dark patterns. Cancel from your account at any time.
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
