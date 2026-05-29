import { Link, useParams } from "wouter";
import { useGetText, useGetTextFlashcards } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Layers, Loader2, RotateCcw, Shuffle, Check } from "lucide-react";
import { useMemo, useState, useCallback } from "react";

type Card = {
  word: string;
  definition: string;
  icon: string;
  inflection: string;
  count: number;
  firstParagraphIndex: number;
};

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Flashcards() {
  const { textId } = useParams();
  const id = parseInt(textId || "0", 10);
  const { data: text } = useGetText(id);
  const { data, isLoading } = useGetTextFlashcards(id);

  const cards = useMemo<Card[]>(() => data?.cards ?? [], [data]);

  const [order, setOrder] = useState<number[] | null>(null);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());

  // Build the initial order once cards arrive.
  const activeOrder = useMemo(() => {
    if (order) return order;
    return cards.map((_, i) => i);
  }, [order, cards]);

  const reset = useCallback(
    (shuffle: boolean) => {
      const base = cards.map((_, i) => i);
      setOrder(shuffle ? shuffled(base) : base);
      setPos(0);
      setFlipped(false);
      setKnown(new Set());
    },
    [cards]
  );

  const total = activeOrder.length;
  const finished = pos >= total;
  const current = !finished ? cards[activeOrder[pos]] : undefined;

  const advance = useCallback(() => {
    setFlipped(false);
    setPos((p) => p + 1);
  }, []);

  const markKnown = useCallback(() => {
    if (finished) return;
    setKnown((prev) => {
      const next = new Set(prev);
      next.add(activeOrder[pos]);
      return next;
    });
    advance();
  }, [finished, activeOrder, pos, advance]);

  const reviewStillLearning = useCallback(() => {
    const remaining = activeOrder.filter((idx) => !known.has(idx));
    setOrder(shuffled(remaining));
    setPos(0);
    setFlipped(false);
    setKnown(new Set());
  }, [activeOrder, known]);

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
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
          <div className="flex items-center gap-2 font-serif text-lg text-primary">
            <Layers className="h-4 w-4" />
            <span>Flashcards</span>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-10">
        <div className="space-y-1 mb-8 text-center">
          <div className="text-sm uppercase tracking-wide text-muted-foreground font-serif">Vocabulary review</div>
          <h1 className="text-2xl md:text-3xl font-serif font-semibold text-primary leading-tight">
            {text?.title ?? "Loading…"}
          </h1>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="font-serif text-muted-foreground">Building your flashcards…</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Layers className="h-12 w-12 mx-auto text-muted-foreground/40" />
            <p className="font-serif text-lg text-muted-foreground">
              No flashcards yet — finish a paragraph (and view its interlinear) to start building your deck.
            </p>
            <Link href={`/texts/${id}`}>
              <Button variant="outline" className="font-serif rounded-full">Back to text</Button>
            </Link>
          </div>
        ) : finished ? (
          <div className="text-center py-16 space-y-6">
            <div className="text-5xl">🎉</div>
            <div className="space-y-1">
              <p className="font-serif text-2xl text-foreground">Deck complete</p>
              <p className="font-serif text-muted-foreground">
                You knew {known.size} of {total} {total === 1 ? "card" : "cards"}.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {known.size < total && (
                <Button onClick={reviewStillLearning} className="font-serif rounded-full gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Review the {total - known.size} I'm still learning
                </Button>
              )}
              <Button variant="outline" onClick={() => reset(true)} className="font-serif rounded-full gap-2">
                <Shuffle className="h-4 w-4" />
                Start over
              </Button>
            </div>
          </div>
        ) : current ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-sm font-serif text-muted-foreground">
              <span className="tabular-nums">Card {pos + 1} of {total}</span>
              <button
                onClick={() => reset(true)}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                title="Shuffle the deck"
              >
                <Shuffle className="h-3.5 w-3.5" />
                Shuffle
              </button>
            </div>

            <button
              onClick={() => setFlipped((f) => !f)}
              className="w-full text-left"
              aria-label="Flip card"
            >
              <div className="min-h-[19rem] rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col items-center justify-center px-6 py-10 gap-4 transition-colors hover:border-border">
                <div className="text-6xl leading-none" aria-hidden="true">{current.icon}</div>
                <div className="font-serif text-4xl md:text-5xl text-foreground text-center">{current.word}</div>

                {!flipped ? (
                  <p className="text-sm font-serif text-muted-foreground/70 pt-2">Tap to reveal meaning</p>
                ) : (
                  <div className="w-full max-w-sm space-y-4 pt-2 text-center">
                    <div className="h-px bg-border/60" />
                    <p className="font-serif text-2xl text-foreground">{current.definition}</p>
                    {current.inflection && (
                      <p className="font-serif text-sm text-muted-foreground border-t border-border/40 pt-3">
                        {current.inflection}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </button>

            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                variant="outline"
                onClick={advance}
                className="font-serif rounded-full px-6 gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Still learning
              </Button>
              <Button
                onClick={markKnown}
                className="font-serif rounded-full px-6 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Check className="h-4 w-4" />
                I know this
              </Button>
            </div>

            <p className="text-center text-xs font-serif text-muted-foreground/70">
              Seen {current.count}× · first in paragraph {current.firstParagraphIndex + 1}
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
}
