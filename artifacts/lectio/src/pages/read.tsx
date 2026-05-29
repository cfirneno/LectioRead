import React, { useState, useEffect, useCallback } from "react";
import { Link, useParams, useLocation } from "wouter";
import { 
  useGetText, 
  useGetParagraph, 
  useGetInterlinearTranslation, 
  useGetFullTranslation,
  useGetScansion,
  useGetParagraphAudio,
  useSaveProgress,
  useLookupWord,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Loader2, Home, Music, ExternalLink, GraduationCap, Volume2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGrammarResource, type GrammarResource } from "@/lib/grammar-resources";
import { QuizOverlay } from "@/components/quiz-overlay";

function WordLookupPopover({
  original,
  translation,
  transliteration,
  grammar,
  language,
}: {
  original: string;
  translation: string;
  transliteration?: string;
  grammar: GrammarResource;
  language: string;
}) {
  const [open, setOpen] = useState(false);
  const isPerseus = /Look up on Perseus/i.test(grammar.lookupLabel);

  const { data, isFetching, error } = useLookupWord(
    { lang: language, word: original },
    {
      query: {
        enabled: open && isPerseus,
        staleTime: 1000 * 60 * 60,
        retry: 1,
      } as never,
    },
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex flex-col items-center group cursor-pointer hover:bg-secondary/40 rounded-md px-2 py-1 -mx-2 -my-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          title={grammar.lookupLabel}
        >
          <span className="font-serif text-2xl md:text-3xl text-foreground mb-1 group-hover:text-primary transition-colors">
            {original}
          </span>
          {transliteration && (
            <span className="font-sans text-xs md:text-sm italic text-muted-foreground tracking-wide mb-1">
              {transliteration}
            </span>
          )}
          <span className="font-sans text-sm md:text-base font-medium text-primary tracking-wide">
            {translation}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="center" className="w-80 max-h-96 overflow-y-auto">
        <div className="space-y-3">
          <div className="border-b pb-2">
            <div className="font-serif text-xl text-foreground">{original}</div>
            <div className="font-sans text-sm text-primary">{translation}</div>
          </div>

          {!isPerseus && (
            <div className="text-sm text-muted-foreground font-serif">
              Detailed parse data isn't available for {grammar.language} yet.
            </div>
          )}

          {isPerseus && isFetching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Looking up on Perseus…
            </div>
          )}

          {isPerseus && error && (
            <div className="text-sm text-muted-foreground">
              Couldn't reach Perseus. Try the link below.
            </div>
          )}

          {isPerseus && data && data.analyses.length === 0 && !isFetching && (
            <div className="text-sm text-muted-foreground font-serif italic">
              No parse found on Perseus for this form.
            </div>
          )}

          {isPerseus && data && data.analyses.length > 0 && (
            <div className="space-y-3">
              {data.analyses.map((a, i) => (
                <div key={i} className="border-l-2 border-primary/40 pl-3">
                  {a.lemma && (
                    <div className="font-serif text-base text-foreground mb-1">
                      {a.lemma}
                    </div>
                  )}
                  <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-0.5 text-sm">
                    {a.features.map((f, j) => (
                      <React.Fragment key={j}>
                        {f.label ? (
                          <>
                            <dt className="font-sans text-xs uppercase tracking-wide text-muted-foreground self-center">
                              {f.label}
                            </dt>
                            <dd className="font-serif text-foreground">{f.value}</dd>
                          </>
                        ) : (
                          <dd className="col-span-2 font-serif text-foreground">{f.value}</dd>
                        )}
                      </React.Fragment>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t">
            <a
              href={data?.sourceUrl ?? grammar.lookupUrl(original)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Open full entry <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function Read() {
  const { textId, index } = useParams();
  const id = parseInt(textId || "0", 10);
  const pIndex = parseInt(index || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [stage, setStage] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [quizOpen, setQuizOpen] = useState(false);

  const { data: text } = useGetText(id);
  const { data: paragraph, isLoading: isLoadingParagraph } = useGetParagraph(id, pIndex, {
    query: { enabled: Number.isFinite(id) && id > 0 && Number.isFinite(pIndex) && pIndex >= 0 } as never,
  });
  
  const interlinearMutation = useGetInterlinearTranslation();
  const fullTranslationMutation = useGetFullTranslation();
  const scansionMutation = useGetScansion();
  const audioMutation = useGetParagraphAudio();
  const saveProgress = useSaveProgress();

  const [interlinearData, setInterlinearData] = useState<any>(null);
  const [fullTransData, setFullTransData] = useState<any>(null);
  const [scannedText, setScannedText] = useState<string | null>(null);
  const [showScansion, setShowScansion] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = React.useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsPlaying(false);
    setAudioReady(false);
  }, []);

  const prepareAudio = useCallback((base64: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    const byteChars = atob(base64);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
    const blob = new Blob([bytes], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    audioUrlRef.current = url;
    const audio = new Audio(url);
    audio.onended = () => setIsPlaying(false);
    audio.onpause = () => setIsPlaying(false);
    audio.onplay = () => setIsPlaying(true);
    audioRef.current = audio;
    setAudioReady(true);
  }, []);

  useEffect(() => {
    setStage(1);
    setInterlinearData(null);
    setFullTransData(null);
    setScannedText(null);
    setShowScansion(false);
    cleanupAudio();
  }, [id, pIndex, cleanupAudio]);

  useEffect(() => cleanupAudio, [cleanupAudio]);

  // Prefetch and prepare the spoken audio as soon as the paragraph loads, so the
  // play button can start playback synchronously within the user's tap. Browsers
  // block play() calls made after an async network response (autoplay policy).
  useEffect(() => {
    if (!paragraph) return;
    let cancelled = false;
    audioMutation.mutate(
      { textId: id, index: pIndex },
      {
        onSuccess: (data) => {
          if (cancelled) return;
          prepareAudio(data.audioBase64);
        },
      }
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, pIndex, paragraph?.id]);

  const handleListen = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.currentTime = 0;
        audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
      return;
    }
    const requestedId = id;
    const requestedIndex = pIndex;
    audioMutation.mutate(
      { textId: id, index: pIndex },
      {
        onSuccess: (data) => {
          if (requestedId !== id || requestedIndex !== pIndex) return;
          prepareAudio(data.audioBase64);
          audioRef.current
            ?.play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        },
      }
    );
  };

  useEffect(() => {
    if (stage !== 2) return;
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, audioReady]);

  const supportsScansion = !!text && /latin|greek|ἑλλην|ελλην/i.test(text.language);
  const grammar = text ? getGrammarResource(text.language) : null;

  const handleToggleScansion = () => {
    if (showScansion) {
      setShowScansion(false);
      return;
    }
    if (scannedText) {
      setShowScansion(true);
      return;
    }
    const requestedId = id;
    const requestedIndex = pIndex;
    scansionMutation.mutate(
      { textId: id, index: pIndex },
      {
        onSuccess: (data) => {
          if (requestedId !== id || requestedIndex !== pIndex) return;
          setScannedText(data.scannedText);
          setShowScansion(true);
        },
      }
    );
  };

  const advanceStage = useCallback(() => {
    if (stage === 1) {
      setStage(2);
    } else if (stage === 2) {
      interlinearMutation.mutate(
        { textId: id, index: pIndex },
        { onSuccess: (data) => { setInterlinearData(data); setStage(3); } }
      );
    } else if (stage === 3) {
      fullTranslationMutation.mutate(
        { textId: id, index: pIndex },
        { onSuccess: (data) => { setFullTransData(data); setStage(4); } }
      );
    } else if (stage === 4) {
      setStage(5);
    } else if (stage === 5) {
      setStage(6);
    }
  }, [stage, id, pIndex, interlinearMutation, fullTranslationMutation]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "BUTTON" ||
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      e.preventDefault();
      if (stage < 6 && !interlinearMutation.isPending && !fullTranslationMutation.isPending) {
        advanceStage();
      } else if (stage === 6) {
        handleGotIt();
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
            <Link href="/app">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" title="Home">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <div className="font-serif text-sm text-muted-foreground line-clamp-1">
              {text?.title} • Paragraph {pIndex + 1}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
              Stage {stage} of 6
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
              
              {/* STAGE 1, 5, 6: Original text (read by eye, read aloud, read again) */}
              {(stage === 1 || stage === 5 || stage === 6) && (
                <div className="text-center max-w-3xl mx-auto space-y-6">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    {stage === 1 && "Read it through once"}
                    {stage === 5 && "Now read it aloud yourself"}
                    {stage === 6 && "Read it through one more time"}
                  </p>
                  <p className="font-serif text-3xl md:text-4xl leading-[1.6] text-foreground whitespace-pre-wrap">
                    {showScansion && scannedText ? scannedText : paragraph.originalText}
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleListen}
                      disabled={audioMutation.isPending}
                      className="font-serif text-sm text-muted-foreground hover:text-foreground gap-2"
                      title="Hear this paragraph read aloud"
                    >
                      {audioMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                      {isPlaying ? "Stop" : "Listen"}
                    </Button>
                    {supportsScansion && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleScansion}
                        disabled={scansionMutation.isPending}
                        className="font-serif text-sm text-muted-foreground hover:text-foreground gap-2"
                      >
                        {scansionMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Music className="h-4 w-4" />
                        )}
                        {showScansion ? "Hide scansion" : "Show scansion"}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* STAGE 2: Listen */}
              {stage === 2 && (
                <div className="text-center max-w-3xl mx-auto space-y-8">
                  <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                    Listen as it's read aloud
                  </p>
                  <div className="flex flex-col items-center gap-5">
                    <button
                      onClick={handleListen}
                      disabled={audioMutation.isPending}
                      className="relative flex items-center justify-center w-24 h-24 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors disabled:opacity-70"
                      title={isPlaying ? "Stop" : "Play audio"}
                    >
                      {isPlaying && (
                        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                      )}
                      {audioMutation.isPending ? (
                        <Loader2 className="h-10 w-10 animate-spin" />
                      ) : (
                        <Volume2 className="h-10 w-10 relative" />
                      )}
                    </button>
                    <p className="font-serif text-sm text-muted-foreground">
                      {audioMutation.isPending
                        ? "Loading audio…"
                        : isPlaying
                          ? "Playing — follow along below"
                          : "Tap to play again"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-secondary/20 px-6 py-8">
                    <p className="font-serif text-2xl md:text-3xl leading-[1.6] text-foreground/90 whitespace-pre-wrap">
                      {paragraph.originalText}
                    </p>
                  </div>
                </div>
              )}

              {/* STAGE 3: Interlinear */}
              {stage === 3 && interlinearData && (
                <div className="space-y-6">
                  <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-6 gap-y-8 md:gap-y-12">
                    {interlinearData.words.map((wordPair: any, i: number) => {
                      if (grammar && text) {
                        return (
                          <WordLookupPopover
                            key={i}
                            original={wordPair.original}
                            translation={wordPair.translation}
                            transliteration={wordPair.transliteration}
                            grammar={grammar}
                            language={text.language}
                          />
                        );
                      }
                      return (
                        <div key={i} className="flex flex-col items-center group">
                          <span className="font-serif text-2xl md:text-3xl text-foreground mb-1">
                            {wordPair.original}
                          </span>
                          {wordPair.transliteration && (
                            <span className="font-sans text-xs md:text-sm italic text-muted-foreground tracking-wide mb-1">
                              {wordPair.transliteration}
                            </span>
                          )}
                          <span className="font-sans text-sm md:text-base font-medium text-primary tracking-wide">
                            {wordPair.translation}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {grammar && (
                    <p className="text-center text-xs text-muted-foreground font-serif italic pt-2">
                      Tap any word to see its parse without leaving the page.
                    </p>
                  )}
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
          {!isGenerating && stage < 6 && (
            <div className="flex items-center gap-4">
              {(stage === 3 || stage === 4) && (
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => setStage(stage === 3 ? 2 : 3)}
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

          {!isGenerating && stage === 6 && (
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
              <Button
                size="lg"
                variant="outline"
                onClick={() => setQuizOpen(true)}
                className="rounded-full px-8 h-14 font-serif text-lg border-border/60 hover:bg-secondary/50 text-foreground"
              >
                <GraduationCap className="h-5 w-5 mr-2" />
                Test yourself
              </Button>
            </div>
          )}
        </div>
      </main>

      {quizOpen && id !== undefined && (
        <QuizOverlay
          textId={id}
          paragraphIndex={pIndex}
          onClose={() => setQuizOpen(false)}
        />
      )}
    </div>
  );
}
