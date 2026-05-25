import { useState, useEffect } from "react";
import { useGetQuiz, useGradeQuiz } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Loader2, X, CheckCircle2, XCircle } from "lucide-react";

type GradedItem = {
  id: number;
  kind: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  chosenIndex: number;
  correct: boolean;
  explanation: string;
};

type QuizOverlayProps = {
  textId: number;
  paragraphIndex: number;
  onClose: () => void;
};

const KIND_LABEL: Record<string, string> = {
  translation: "Translation",
  vocab: "Vocabulary",
  grammar: "Grammar",
};

export function QuizOverlay({ textId, paragraphIndex, onClose }: QuizOverlayProps) {
  const quizMutation = useGetQuiz();
  const gradeMutation = useGradeQuiz();

  const [loaded, setLoaded] = useState(false);
  const [questions, setQuestions] = useState<
    Array<{ id: number; kind: string; prompt: string; options: string[] }>
  >([]);
  const [paragraphText, setParagraphText] = useState("");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; total: number; items: GradedItem[] } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    quizMutation.mutate(
      { textId, index: paragraphIndex },
      {
        onSuccess: (data) => {
          if (cancelled) return;
          setQuestions(data.questions);
          setParagraphText(data.paragraphText);
          setLoaded(true);
        },
        onError: () => {
          if (cancelled) return;
          setLoadError("We couldn't build a quiz right now. Please try again in a moment.");
        },
      },
    );
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textId, paragraphIndex]);

  function choose(qid: number, idx: number) {
    setAnswers((a) => ({ ...a, [qid]: idx }));
  }

  function submit() {
    setGradeError(null);
    const payload = questions.map((q) => ({ id: q.id, chosenIndex: answers[q.id] ?? -1 }));
    gradeMutation.mutate(
      { textId, index: paragraphIndex, data: { answers: payload } },
      {
        onSuccess: (data) => {
          setResult({ score: data.score, total: data.total, items: data.items as GradedItem[] });
        },
        onError: () => {
          setGradeError("We couldn't grade your quiz. Please try again.");
        },
      },
    );
  }

  const allAnswered = loaded && questions.every((q) => typeof answers[q.id] === "number");
  const currentQ = questions[current];

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl text-foreground">
            {result ? "How you did" : "Test yourself"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close quiz">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {loadError && (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">{loadError}</p>
            <Button onClick={onClose} variant="outline">Back to reading</Button>
          </div>
        )}

        {!loaded && !loadError && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm font-serif">Writing your quiz…</p>
          </div>
        )}

        {loaded && !result && currentQ && (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground font-serif flex items-center justify-between">
              <span>Question {current + 1} of {questions.length} · {KIND_LABEL[currentQ.kind] ?? currentQ.kind}</span>
              <span>{Object.keys(answers).length}/{questions.length} answered</span>
            </div>

            {currentQ.kind === "translation" && (
              <div className="rounded-lg border border-border/50 bg-secondary/30 p-4 font-serif text-lg leading-relaxed text-foreground">
                {paragraphText}
              </div>
            )}

            <p className="font-serif text-lg text-foreground">{currentQ.prompt}</p>

            <div className="space-y-2">
              {currentQ.options.map((opt, i) => {
                const selected = answers[currentQ.id] === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => choose(currentQ.id, i)}
                    className={`w-full text-left rounded-lg border px-4 py-3 font-serif text-base transition-colors ${
                      selected
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border/60 hover:border-border hover:bg-secondary/40 text-foreground"
                    }`}
                  >
                    <span className="text-xs text-muted-foreground mr-2">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={current === 0}
              >
                Previous
              </Button>
              {current < questions.length - 1 ? (
                <Button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}>
                  Next
                </Button>
              ) : (
                <Button onClick={submit} disabled={!allAnswered || gradeMutation.isPending}>
                  {gradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
                </Button>
              )}
            </div>
            {gradeError && (
              <p className="text-sm text-red-600 text-center font-serif">{gradeError}</p>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="font-serif text-5xl text-primary">{result.score} / {result.total}</div>
              <p className="text-muted-foreground font-serif mt-2">
                {result.score === result.total
                  ? "Perfect — really well done."
                  : result.score >= Math.ceil(result.total * 0.7)
                    ? "Nicely done. Review the misses below."
                    : "Worth another look. The explanations below should help."}
              </p>
            </div>

            <div className="space-y-4">
              {result.items.map((it) => (
                <div
                  key={it.id}
                  className={`rounded-lg border p-4 space-y-2 ${
                    it.correct ? "border-green-600/40 bg-green-600/5" : "border-red-600/40 bg-red-600/5"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {it.correct ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground font-sans mb-1">
                        {KIND_LABEL[it.kind] ?? it.kind}
                      </div>
                      <p className="font-serif text-foreground">{it.prompt}</p>
                    </div>
                  </div>
                  <div className="pl-7 text-sm space-y-1 font-serif">
                    <p>
                      <span className="text-muted-foreground">Correct: </span>
                      <span className="text-foreground">{it.options[it.correctIndex]}</span>
                    </p>
                    {!it.correct && it.chosenIndex >= 0 && (
                      <p>
                        <span className="text-muted-foreground">Your answer: </span>
                        <span className="text-foreground">{it.options[it.chosenIndex]}</span>
                      </p>
                    )}
                    {it.explanation && (
                      <p className="text-muted-foreground italic pt-1">{it.explanation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <Button onClick={onClose} className="rounded-full px-8 h-12 font-serif text-base">
                Back to reading
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
