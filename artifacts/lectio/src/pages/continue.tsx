import { Link } from "wouter";
import { useGetRecentTexts } from "@workspace/api-client-react";
import { BookOpen, ArrowLeft, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function ContinueReading() {
  const { data: recentTexts, isLoading } = useGetRecentTexts();

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
            Continue Reading
          </h1>
          <p className="text-muted-foreground text-lg">
            Pick up where you left off. Each card takes you back to your place in the text.
          </p>
        </section>

        {isLoading ? (
          <div className="text-center text-muted-foreground font-serif py-12">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3 text-primary" />
            <p>Finding your place…</p>
          </div>
        ) : recentTexts && recentTexts.length > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentTexts.map((text) => {
              const percent = Math.round((text.completedCount / text.paragraphCount) * 100) || 0;
              const nextIndex =
                text.lastParagraphIndex !== undefined && text.lastParagraphIndex !== null
                  ? text.lastParagraphIndex
                  : 0;
              return (
                <Link href={`/texts/${text.id}/read/${nextIndex}`} key={text.id}>
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer bg-card/50">
                    <CardContent className="p-5 space-y-3">
                      <div>
                        <h3 className="font-serif text-lg font-semibold leading-snug">{text.title}</h3>
                        <p className="text-sm text-muted-foreground">{text.author}</p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{text.language}</span>
                          <span>
                            {percent}% · {text.completedCount}/{text.paragraphCount} paragraphs
                          </span>
                        </div>
                        <Progress value={percent} className="h-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </section>
        ) : (
          <section className="text-center max-w-md mx-auto space-y-4 py-12">
            <Clock className="h-8 w-8 text-muted-foreground/50 mx-auto" />
            <p className="font-serif text-lg text-foreground">Nothing in progress yet</p>
            <p className="text-sm text-muted-foreground">
              Once you start reading a text, it will appear here so you can return to it anytime.
            </p>
            <Link href="/app">
              <Button className="font-serif mt-2">Browse the library</Button>
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
