import { Link } from "wouter";
import { useGetReview } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, BookOpen, Sparkles } from "lucide-react";

const KIND_LABEL: Record<string, string> = {
  translation: "Translation",
  vocab: "Vocabulary",
  grammar: "Grammar",
};

export default function Review() {
  const { data, isLoading } = useGetReview();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="border-b border-border/40">
        <div className="container max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/app">
            <Button variant="ghost" size="sm" className="font-serif text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Library
            </Button>
          </Link>
          <div className="flex items-center gap-2 font-serif text-lg text-primary">
            <Sparkles className="h-4 w-4" />
            <span>Review</span>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-10 space-y-8">
        {isLoading && (
          <div className="flex justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && data && (
          <>
            <section className="text-center space-y-2">
              <h1 className="font-serif text-3xl text-primary">Your weak spots</h1>
              <p className="text-muted-foreground font-serif">
                Questions you've missed across all your quizzes, gathered here for a second look.
              </p>
            </section>

            {data.totalAttempts > 0 && (
              <div className="flex justify-center gap-12 py-2">
                <div className="text-center">
                  <div className="font-serif text-3xl text-foreground">{data.totalAttempts}</div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Quizzes taken</div>
                </div>
                <div className="text-center">
                  <div className="font-serif text-3xl text-foreground">
                    {data.totalPossible > 0
                      ? Math.round((data.totalScore / data.totalPossible) * 100)
                      : 0}
                    %
                  </div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-sans">Average score</div>
                </div>
              </div>
            )}

            {data.totalAttempts === 0 && (
              <Card className="bg-card/50">
                <CardContent className="p-8 text-center space-y-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="font-serif text-lg text-foreground">No quizzes yet</p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    After you finish reading a paragraph, tap "Test yourself" to take a short quiz.
                    Things you miss will collect here so you can review them later.
                  </p>
                  <Link href="/app">
                    <Button variant="outline" className="font-serif">Go to the library</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {data.weakItems.length > 0 && (
              <div className="space-y-3">
                {data.weakItems.map((item, idx) => (
                  <Card key={idx} className="bg-card/40 border-border/60">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="uppercase tracking-wide text-muted-foreground font-sans">
                          {KIND_LABEL[item.kind] ?? item.kind}
                          {item.textTitle ? ` · ${item.textTitle}` : ""}
                        </span>
                        <span className="text-muted-foreground font-sans">
                          missed {item.missedCount}×
                        </span>
                      </div>
                      <p className="font-serif text-foreground">{item.prompt}</p>
                      {item.correctAnswer && (
                        <p className="text-sm text-foreground font-serif">
                          <span className="text-muted-foreground">Correct: </span>
                          {item.correctAnswer}
                        </p>
                      )}
                      {item.explanation && (
                        <p className="text-sm text-muted-foreground italic font-serif">
                          {item.explanation}
                        </p>
                      )}
                      {item.textId !== undefined && item.paragraphIndex !== undefined && (
                        <div className="pt-1">
                          <Link href={`/texts/${item.textId}/read/${item.paragraphIndex}`}>
                            <Button variant="ghost" size="sm" className="font-serif text-xs h-7 px-2">
                              Re-read this paragraph →
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {data.totalAttempts > 0 && data.weakItems.length === 0 && (
              <Card className="bg-card/50">
                <CardContent className="p-8 text-center space-y-3">
                  <p className="font-serif text-lg text-foreground">Nothing to review — every quiz answer correct.</p>
                  <p className="text-sm text-muted-foreground">Keep reading.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
