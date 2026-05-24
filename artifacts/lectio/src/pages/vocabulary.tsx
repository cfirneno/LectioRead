import { Link, useParams } from "wouter";
import { useGetText, useGetTextVocabulary } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Home } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

export default function Vocabulary() {
  const { textId } = useParams();
  const id = parseInt(textId || "0", 10);
  const { data: text } = useGetText(id);
  const { data: vocab, isLoading } = useGetTextVocabulary(id);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<"frequency" | "alpha" | "first">("frequency");

  const fold = (s: string) =>
    s.normalize("NFKD").replace(/\p{M}+/gu, "").toLocaleLowerCase();

  const entries = useMemo(() => {
    if (!vocab) return [];
    const f = fold(filter.trim());
    const filtered = f
      ? vocab.entries.filter(
          (e) => fold(e.original).includes(f) || fold(e.translation).includes(f)
        )
      : vocab.entries;
    const sorted = [...filtered];
    if (sort === "alpha") {
      sorted.sort((a, b) => a.original.localeCompare(b.original));
    } else if (sort === "first") {
      sorted.sort((a, b) => a.firstParagraphIndex - b.firstParagraphIndex);
    } else {
      sorted.sort((a, b) => b.count - a.count || a.original.localeCompare(b.original));
    }
    return sorted;
  }, [vocab, filter, sort]);

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Link href={`/texts/${id}`}>
              <Button variant="ghost" size="sm" className="font-serif gap-2 -ml-3 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <Link href="/app">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Home">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="text-sm font-serif text-muted-foreground">
            {vocab ? `${vocab.entries.length} words` : ""}
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-2 mb-8">
          <div className="text-sm uppercase tracking-wide text-muted-foreground font-serif">Vocabulary</div>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-primary leading-tight">
            {text?.title ?? "Loading…"}
          </h1>
          {vocab && vocab.throughParagraphIndex >= 0 && (
            <p className="text-muted-foreground font-serif">
              Words you've encountered through paragraph {vocab.throughParagraphIndex + 1}.
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : !vocab || vocab.entries.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <p className="font-serif text-lg text-muted-foreground">
              No vocabulary yet — finish a paragraph (and view its interlinear) to start your running list.
            </p>
            <Link href={`/texts/${id}`}>
              <Button variant="outline" className="font-serif rounded-full">Back to text</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Input
                placeholder="Filter words or meanings…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="font-serif"
              />
              <div className="flex gap-1 rounded-md border border-border/40 p-1 text-sm font-serif">
                {(["frequency", "alpha", "first"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`px-3 py-1.5 rounded transition-colors ${
                      sort === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s === "frequency" ? "Most used" : s === "alpha" ? "A–Z" : "First seen"}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-border/40 border-y border-border/40">
              {entries.map((e) => (
                <Link
                  key={e.original + e.firstParagraphIndex}
                  href={`/texts/${id}/read/${e.firstParagraphIndex}`}
                >
                  <div className="group grid grid-cols-[1fr_1fr_auto] gap-4 items-baseline px-2 py-3 hover:bg-secondary/40 transition-colors cursor-pointer">
                    <div className="font-serif text-lg text-foreground">{e.original}</div>
                    <div className="font-serif text-muted-foreground">{e.translation}</div>
                    <div className="text-xs font-serif text-muted-foreground/70 tabular-nums">
                      ×{e.count} · ¶{e.firstParagraphIndex + 1}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {entries.length === 0 && (
              <p className="text-center py-12 text-muted-foreground font-serif">No matches.</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
