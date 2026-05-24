import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useLocation } from "wouter";
import { 
  useGetText, 
  useGetParagraph, 
  useGetInterlinearTranslation, 
  useGetFullTranslation,
  useSaveProgress
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Read() {
  const { textId, index } = useParams();
  const id = parseInt(textId || "0", 10);
  const pIndex = parseInt(index || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [stage, setStage] = useState<1 | 2 | 3 | 4 | 5>(1);

  const { data: text } = useGetText(id);
  const { data: paragraph, isLoading: isLoadingParagraph } = useGetParagraph(id, pIndex);
  
  const interlinearMutation = useGetInterlinearTranslation();
  const fullTranslationMutation = useGetFullTranslation();
  const saveProgress = useSaveProgress();

  const [interlinearData, setInterlinearData] = useState<any>(null);
  const [fullTransData, setFullTransData] = useState<any>(null);

  useEffect(() => {
    setStage(1);
    setInterlinearData(null);
    setFullTransData(null);
  }, [id, pIndex]);

  const advanceStage = useCallback(() => {
    if (stage === 1) {
      interlinearMutation.mutate(
        { textId: id, index: pIndex },
        { onSuccess: (data) => { setInterlinearData(data); setStage(2); } }
      );
    } else if (stage === 2) {
      setStage(3);
    } else if (stage === 3) {
      fullTranslationMutation.mutate(
        { textId: id, index: pIndex },
        { onSuccess: (data) => { setFullTransData(data); setStage(4); } }
      );
    } else if (stage === 4) {
      setStage(5);
    }
  }, [stage, id, pIndex, interlinearMutation, fullTranslationMutation]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (stage < 5 && !interlinearMutation.isPending && !fullTranslationMutation.isPending) {
          advanceStage();
        } else if (stage === 5) {
          handleGotIt();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, advanceStage, interlinearMutation.isPending, fullTranslationMutation.isPending]);

  const handleGotIt = () => {
    saveProgress.mutate(
      { data: { textId: id, paragraphIndex: pIndex, completed: true } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [`/api/texts/${id}/paragraphs`] });
          queryClient.invalidateQueries({ queryKey: [`/api/texts/${id}/stats`] });
          
          if (text && pIndex + 1 < text.paragraphCount) {
            setLocation(`/texts/${id}/read/${pIndex + 1}`);
          } else {
            setLocation(`/texts/${id}`);
          }
        }
      }
    );
  };

  const handleTryAgain = () => {
    setStage(1);
  };

  if (isLoadingParagraph || !paragraph) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-serif text-muted-foreground">Opening manuscript...</p>
      </div>
    );
  }

  const isGenerating = interlinearMutation.isPending || fullTranslationMutation.isPending;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur shrink-0">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/texts/${id}`}>
              <Button variant="ghost" size="icon" className="-ml-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="font-serif text-sm text-muted-foreground line-clamp-1">
              {text?.title} • Paragraph {pIndex + 1}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
              Stage {stage} of 5
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col container max-w-5xl mx-auto px-4 py-8 md:py-16">
        <div className="flex-grow flex items-center justify-center min-h-[50vh]">
          {isGenerating ? (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto opacity-50" />
              <p className="text-muted-foreground font-serif italic text-lg">Generating translation...</p>
            </div>
          ) : (
            <div className="w-full max-w-4xl animate-in fade-in zoom-in duration-500">
              
              {/* STAGE 1, 3, 5: Original text only */}
              {(stage === 1 || stage === 3 || stage === 5) && (
                <div className="text-center max-w-3xl mx-auto">
                  <p className="font-serif text-3xl md:text-4xl leading-[1.6] text-foreground">
                    {paragraph.originalText}
                  </p>
                </div>
              )}

              {/* STAGE 2: Interlinear */}
              {stage === 2 && interlinearData && (
                <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-6 gap-y-8 md:gap-y-12">
                  {interlinearData.words.map((wordPair: any, i: number) => (
                    <div key={i} className="flex flex-col items-center group">
                      <span className="font-serif text-2xl md:text-3xl text-foreground mb-2">
                        {wordPair.original}
                      </span>
                      <span className="font-sans text-sm md:text-base font-medium text-primary tracking-wide">
                        {wordPair.translation}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* STAGE 4: Side-by-side */}
              {stage === 4 && fullTransData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                  <div>
                    <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-6">{text?.language}</h3>
                    <p className="font-serif text-2xl leading-relaxed text-foreground">
                      {paragraph.originalText}
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-4 md:-left-8 top-0 bottom-0 w-px bg-border/50 hidden md:block" />
                    <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-6">English</h3>
                    <p className="font-serif text-2xl leading-relaxed text-muted-foreground">
                      {fullTransData.translatedText}
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        <div className="shrink-0 flex justify-center py-8">
          {!isGenerating && stage < 5 && (
            <div className="flex items-center gap-4">
              {(stage === 2 || stage === 4) && (
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => setStage(stage === 2 ? 1 : 3)}
                  className="rounded-full px-8 h-14 font-serif text-lg text-muted-foreground hover:text-foreground"
                >
                  ← Back
                </Button>
              )}
              <div className="text-center space-y-2">
                <Button 
                  size="lg" 
                  onClick={advanceStage}
                  className="rounded-full px-12 h-14 font-serif text-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                >
                  Continue
                </Button>
                <p className="text-xs text-muted-foreground font-sans hidden md:block">Press Enter ↵</p>
              </div>
            </div>
          )}

          {!isGenerating && stage === 5 && (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleTryAgain}
                className="rounded-full px-8 h-14 font-serif text-lg border-border/60 hover:bg-secondary/50 text-foreground"
              >
                Try Again
              </Button>
              <div className="text-center space-y-2">
                <Button 
                  size="lg" 
                  onClick={handleGotIt}
                  className="rounded-full px-12 h-14 font-serif text-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                  disabled={saveProgress.isPending}
                >
                  {saveProgress.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "I got it"}
                </Button>
                <p className="text-xs text-muted-foreground font-sans hidden md:block">Press Enter ↵</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
