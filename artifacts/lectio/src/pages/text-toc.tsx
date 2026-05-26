import React from "react";
import { Link, useParams } from "wouter";
import { useGetText, useListParagraphs, useGetTextStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Circle, BookOpen, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getGrammarResource } from "@/lib/grammar-resources";

export default function TextToc() {
  const { textId } = useParams();
  const id = parseInt(textId || "0", 10);

  const { data: text, isLoading: isLoadingText } = useGetText(id);
  const { data: paragraphs, isLoading: isLoadingParagraphs } = useListParagraphs(id);
  const { data: stats } = useGetTextStats(id);

  if (isLoadingText || isLoadingParagraphs) {
    return (
      <div className="min-h-[100dvh] bg-background container max-w-4xl mx-auto px-4 py-12 space-y-8">
        <Skeleton className="h-10 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
        </div>
        <div className="space-y-4 pt-8">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!text || !paragraphs) {
    return <div className="p-8 text-center text-muted-foreground font-serif">Text not found.</div>;
  }

  const firstUnread = paragraphs.find(p => !p.completed)?.index ?? 0;
  const grammar = getGrammarResource(text.language);

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/app">
            <Button variant="ghost" size="sm" className="font-serif gap-2 -ml-3 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Library
            </Button>
          </Link>
          <div className="text-sm font-serif text-muted-foreground hidden sm:block">
            {stats && `${stats.percentComplete}% Complete`}
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-6 mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-primary leading-tight">
            {text.title}
          </h1>
          <p className="text-xl text-muted-foreground font-serif">{text.author}</p>
          
          <div className="pt-6 flex flex-wrap gap-3 justify-center">
            <Link href={`/texts/${text.id}/read/0`}>
              <Button size="lg" className="rounded-full px-8 font-serif text-lg bg-primary hover:bg-primary/90 text-primary-foreground">
                Begin Reading
              </Button>
            </Link>
            {stats && stats.completedParagraphs > 0 && firstUnread > 0 && (
              <Link href={`/texts/${text.id}/read/${firstUnread}`}>
                <Button size="lg" variant="secondary" className="rounded-full px-6 font-serif text-lg">
                  Continue where you left off
                </Button>
              </Link>
            )}
            {stats && stats.completedParagraphs > 0 && (
              <Link href={`/texts/${text.id}/vocabulary`}>
                <Button size="lg" variant="outline" className="rounded-full px-6 font-serif text-lg gap-2">
                  <BookOpen className="h-4 w-4" />
                  Vocabulary
                </Button>
              </Link>
            )}
            {grammar && (
              <a href={grammar.grammarUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="rounded-full px-6 font-serif text-lg gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Grammar
                </Button>
              </a>
            )}
          </div>
          {grammar && (
            <p className="text-xs text-muted-foreground font-serif pt-1">
              Reference: <a href={grammar.grammarUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{grammar.grammarTitle}</a>
              {grammar.grammarNote ? ` — ${grammar.grammarNote}` : ""}
            </p>
          )}
        </div>

        <div className="space-y-1">
          {paragraphs.map((p) => (
            <Link href={`/texts/${text.id}/read/${p.index}`} key={p.id}>
              <div className="group flex gap-4 p-4 rounded-lg hover:bg-secondary/40 transition-colors cursor-pointer border border-transparent hover:border-border/40">
                <div className="flex-shrink-0 mt-1">
                  {p.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40 group-hover:text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-2 flex-grow">
                  <div className="text-sm font-medium text-muted-foreground">Paragraph {p.index + 1}</div>
                  <p className={`font-serif text-lg leading-relaxed line-clamp-2 ${p.completed ? "text-muted-foreground" : "text-foreground"}`}>
                    {p.originalText}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
