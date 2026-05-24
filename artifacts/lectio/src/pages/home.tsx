import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useSearchText, useListTexts, useGetRecentTexts } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Search, Loader2, BookMarked, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const searchMutation = useSearchText();
  const { data: recentTexts, isLoading: isLoadingRecent } = useGetRecentTexts();
  const { data: allTexts, isLoading: isLoadingAll } = useListTexts();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    searchMutation.mutate(
      { data: { query: searchQuery } },
      {
        onSuccess: (data) => {
          setLocation(`/texts/${data.id}`);
        },
        onError: () => {
          toast({
            title: "Search failed",
            description: "Could not find or process the requested text. Try a different query.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground selection:bg-primary/20">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif text-2xl font-semibold text-primary">
            <BookOpen className="h-6 w-6" />
            <span>Lectio</span>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-12 space-y-16">
        <section className="text-center max-w-2xl mx-auto space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-serif font-semibold text-primary tracking-tight">
              A quiet room for classical reading
            </h1>
            <p className="text-lg text-muted-foreground font-serif">
              Search for any text to begin. Read slowly.
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={searchMutation.isPending}
              placeholder="e.g. The Prince by Machiavelli, chapter 1..."
              className="pl-12 pr-24 h-14 text-lg font-serif bg-card border-border/60 shadow-sm focus-visible:ring-primary/20 rounded-lg placeholder:text-muted-foreground/60"
            />
            <Button
              type="submit"
              disabled={searchMutation.isPending || !searchQuery.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {searchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Read"}
            </Button>
          </form>

          {searchMutation.isPending && (
            <div className="text-sm text-muted-foreground animate-pulse font-serif italic">
              Searching archives and preparing manuscript...
            </div>
          )}
        </section>

        {recentTexts && recentTexts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-xl font-serif font-medium text-foreground">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2>Continue Reading</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentTexts.map((text) => {
                const percent = Math.round((text.completedCount / text.paragraphCount) * 100) || 0;
                const nextIndex = text.lastParagraphIndex !== undefined && text.lastParagraphIndex !== null ? text.lastParagraphIndex : 0;
                return (
                  <Link href={`/texts/${text.id}/read/${nextIndex}`} key={text.id}>
                    <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer bg-card/50">
                      <CardContent className="p-6 space-y-4">
                        <div className="space-y-1">
                          <h3 className="font-serif text-xl font-semibold leading-tight line-clamp-2">
                            {text.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">{text.author}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{text.language}</span>
                            <span>{percent}% ({text.completedCount}/{text.paragraphCount})</span>
                          </div>
                          <Progress value={percent} className="h-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {allTexts && allTexts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-xl font-serif font-medium text-foreground border-b border-border/40 pb-4">
              <BookMarked className="h-5 w-5 text-muted-foreground" />
              <h2>Library</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allTexts.map((text) => (
                <Link href={`/texts/${text.id}`} key={text.id}>
                  <Card className="h-full hover:bg-card transition-colors cursor-pointer border-border/40 shadow-sm">
                    <CardHeader className="p-5">
                      <CardTitle className="font-serif text-lg leading-tight line-clamp-2">{text.title}</CardTitle>
                      <CardDescription>{text.author}</CardDescription>
                    </CardHeader>
                    <CardContent className="px-5 pb-5 pt-0">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground border-transparent">
                        {text.language}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
