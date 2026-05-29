import { Link } from "wouter";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const VIDEOS = [
  {
    title: "The Aeneid — Opening",
    description:
      "Meet Virgil's epic. The host sets the scene, then reads the opening lines aloud with a word-by-word translation.",
    src: "/lectio-intro/",
  },
  {
    title: "The Laocoön Warning",
    description:
      'Trust no Trojan horse. A short tale from Book 2, ending with "Equo ne credite, Teucri" read aloud and broken down word by word.',
    src: "/lectio-laocoon/",
  },
];

export default function Videos() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/20">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/app">
            <div className="flex items-center gap-2 font-serif text-2xl font-semibold text-primary cursor-pointer">
              <BookOpen className="h-6 w-6" />
              <span>Lectio</span>
            </div>
          </Link>
          <Link href="/app">
            <Button variant="ghost" size="sm" className="font-serif text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Library
            </Button>
          </Link>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-10 space-y-12">
        <section className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-primary tracking-tight">
            Watch & Listen
          </h1>
          <p className="text-muted-foreground text-lg">
            Short narrated introductions to the texts. Each one ends with the original passage read
            aloud and translated word by word.
          </p>
        </section>

        <section className="space-y-12">
          {VIDEOS.map((video) => (
            <article key={video.src} className="space-y-3">
              <div className="space-y-1">
                <h2 className="text-2xl font-serif font-semibold text-foreground">{video.title}</h2>
                <p className="text-muted-foreground">{video.description}</p>
              </div>
              <div className="overflow-hidden rounded-xl border border-border/60 bg-black shadow-sm">
                <div className="aspect-video w-full">
                  <iframe
                    src={video.src}
                    title={video.title}
                    className="h-full w-full border-0"
                    allow="autoplay; fullscreen"
                  />
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
