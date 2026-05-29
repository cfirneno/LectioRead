import { Link } from "wouter";
import { BookOpen, ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VIDEOS } from "@/lib/videos";

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

      <main className="container max-w-4xl mx-auto px-4 py-10 space-y-10">
        <section className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-primary tracking-tight">
            Watch & Listen
          </h1>
          <p className="text-muted-foreground text-lg">
            Short narrated introductions to the texts. Each one ends with the original passage read
            aloud and translated word by word.
          </p>
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          {VIDEOS.map((video) => (
            <Link key={video.slug} href={`/app/videos/${video.slug}`}>
              <Card className="group cursor-pointer overflow-hidden border-border/60 transition-colors hover:border-primary/50">
                <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-primary/15 via-background to-background">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-md transition-transform group-hover:scale-110">
                    <Play className="h-6 w-6 translate-x-0.5 fill-current" />
                  </div>
                </div>
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {video.subtitle}
                  </p>
                  <h2 className="font-serif text-xl font-semibold text-foreground">{video.title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
