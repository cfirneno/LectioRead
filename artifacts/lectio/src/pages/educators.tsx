import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscribeNewsletter } from "@workspace/api-client-react";
import { BookOpen, GraduationCap, Layers, Languages, CheckCircle2, Mail } from "lucide-react";

const CONTACT_EMAIL = "charles@risxsci.com";

export default function Educators() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscribe = useSubscribeNewsletter();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !value.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    subscribe.mutate(
      { data: { email: value, source: "educators" } },
      {
        onSuccess: () => setDone(true),
        onError: () => setError("Something went wrong — please try again."),
      }
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="border-b border-border/40">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 font-serif text-2xl font-semibold text-primary cursor-pointer">
              <BookOpen className="h-6 w-6" />
              <span>Lectio</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/app">
              <Button variant="ghost" className="font-serif">Browse the library</Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="ghost" className="font-serif">Sign in</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-16 md:py-20 space-y-16">
        <section className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground font-serif text-sm">
              <GraduationCap className="h-4 w-4" />
              For language &amp; classics departments
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-primary tracking-tight leading-tight">
            A free reading tool for your students.
          </h1>
          <p className="text-lg text-muted-foreground font-serif max-w-2xl mx-auto leading-relaxed">
            Lectio helps students read the great works in their original languages —
            Latin, Greek, Italian, French, German, Spanish, Russian, and Japanese —
            with a word-by-word gloss, full translation, and a structured five-stage
            reading cycle. Everything is free, with no account required to read.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a href="https://lectioread.com" target="_blank" rel="noreferrer">
              <Button size="lg" className="font-serif">Visit lectioread.com</Button>
            </a>
            <Link href="/app">
              <Button size="lg" variant="outline" className="font-serif">Browse the library</Button>
            </Link>
          </div>
        </section>

        <section className="pt-2">
          <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-border/60 shadow-lg aspect-video bg-black">
            <iframe
              className="h-full w-full"
              src="https://www.youtube-nocookie.com/embed/PhjvB98pG4k?rel=0"
              title="The Aeneid — Introduction"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="mt-3 text-center text-sm text-muted-foreground font-serif">
            A sample narrated reading — <em>The Aeneid</em>, Introduction
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-8 border-t border-border/40 pt-14">
          <div className="space-y-2">
            <Layers className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-lg font-semibold">Built for close reading</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Each paragraph cycles through original, interlinear gloss, side-by-side
              translation, and back — ideal for prep, review, and exam passages.
            </p>
          </div>
          <div className="space-y-2">
            <Languages className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-lg font-semibold">Eight languages</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hundreds of public-domain classics, plus search for any other
              public-domain work — with macrons and scansion for Latin and Greek verse.
            </p>
          </div>
          <div className="space-y-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-lg font-semibold">Free, no catch</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No ads, no tracking, no paywall. Students can start reading immediately;
              an optional free account saves progress, vocabulary, and flashcards.
            </p>
          </div>
        </section>

        <section className="border-t border-border/40 pt-14 space-y-6 text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-semibold text-primary">
            Stay in the loop
          </h2>
          <p className="text-muted-foreground font-serif max-w-xl mx-auto">
            Get occasional updates as we add works, languages, and classroom features —
            scansion, grammar notes, and audio. No spam, unsubscribe anytime.
          </p>
          {done ? (
            <p className="font-serif text-primary inline-flex items-center gap-2 justify-center">
              <CheckCircle2 className="h-5 w-5" />
              Thank you — you're on the list.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="font-serif"
                aria-label="Email address"
              />
              <Button type="submit" disabled={subscribe.isPending} className="font-serif whitespace-nowrap">
                {subscribe.isPending ? "Subscribing…" : "Subscribe"}
              </Button>
            </form>
          )}
          {error && <p className="text-sm text-destructive font-serif">{error}</p>}
        </section>

        <section className="border-t border-border/40 pt-14 space-y-4 text-center">
          <h2 className="text-2xl font-serif font-semibold text-primary">
            Questions, or want to use Lectio in class?
          </h2>
          <p className="text-muted-foreground font-serif max-w-xl mx-auto">
            I'm happy to help your department get started. Reach out anytime.
          </p>
          <a href={`mailto:${CONTACT_EMAIL}?subject=Lectio%20for%20our%20department`}>
            <Button size="lg" variant="outline" className="font-serif gap-2">
              <Mail className="h-4 w-4" />
              {CONTACT_EMAIL}
            </Button>
          </a>
        </section>
      </main>

      <footer className="border-t border-border/40 mt-16">
        <div className="container max-w-5xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground font-serif">
          Lectio · lectioread.com
        </div>
      </footer>
    </div>
  );
}
