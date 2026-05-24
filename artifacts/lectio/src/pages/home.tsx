import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { UserButton } from "@clerk/react";
import { useSearchText, useListTexts, useGetRecentTexts, useCreateBillingPortalSession } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Search, Loader2, Clock, ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CatalogText {
  query: string;
  title: string;
  author: string;
  language: string;
  year: string;
  description: string;
}

const CATALOG: CatalogText[] = [
  {
    query: "Il Principe by Machiavelli, chapters 1-3",
    title: "Il Principe",
    author: "Niccolò Machiavelli",
    language: "Italian",
    year: "1532",
    description: "On the nature of principalities and how they are acquired",
  },
  {
    query: "Divina Commedia, Inferno Canto I by Dante Alighieri",
    title: "Inferno — Canto I",
    author: "Dante Alighieri",
    language: "Italian",
    year: "c. 1320",
    description: "Nel mezzo del cammin di nostra vita",
  },
  {
    query: "De Bello Gallico Book I chapters 1-5 by Julius Caesar",
    title: "De Bello Gallico — Liber I",
    author: "Julius Caesar",
    language: "Latin",
    year: "c. 58 BC",
    description: "Gallia est omnis divisa in partes tres",
  },
  {
    query: "Meditations Book I by Marcus Aurelius in Greek",
    title: "Τὰ εἰς ἑαυτόν — Book I",
    author: "Marcus Aurelius",
    language: "Greek",
    year: "c. 170 AD",
    description: "Personal reflections on Stoic philosophy",
  },
  {
    query: "Aeneid Book I opening by Virgil in Latin",
    title: "Aeneis — Liber I",
    author: "Virgil",
    language: "Latin",
    year: "19 BC",
    description: "Arma virumque cano — the fall of Troy and Rome's founding",
  },
  {
    query: "Iliad Book I opening by Homer in Ancient Greek",
    title: "Ἰλιάς — Book I",
    author: "Homer",
    language: "Greek",
    year: "c. 750 BC",
    description: "Μῆνιν ἄειδε θεά — the wrath of Achilles",
  },
  {
    query: "Don Quijote Part 1 Chapter 1 by Cervantes in Spanish",
    title: "Don Quijote — Capítulo I",
    author: "Miguel de Cervantes",
    language: "Spanish",
    year: "1605",
    description: "En un lugar de la Mancha de cuyo nombre no quiero acordarme",
  },
  {
    query: "Les Misérables Part 1 Book 1 Chapter 1 by Victor Hugo in French",
    title: "Les Misérables — Livre I",
    author: "Victor Hugo",
    language: "French",
    year: "1862",
    description: "The bishop of Digne and his quiet, virtuous life",
  },
  {
    query: "Epistulae Morales Ad Lucilium Letter 1 by Seneca in Latin",
    title: "Epistulae Morales — I",
    author: "Seneca",
    language: "Latin",
    year: "c. 65 AD",
    description: "Ita fac mi Lucili — vindica te tibi",
  },
  {
    query: "Faust Part I opening monologue by Goethe in German",
    title: "Faust — Erster Teil",
    author: "Johann Wolfgang von Goethe",
    language: "German",
    year: "1808",
    description: "Habe nun, ach! Philosophie studirt",
  },
  {
    query: "Odyssey Book I opening by Homer in Ancient Greek",
    title: "Ὀδύσσεια — Book I",
    author: "Homer",
    language: "Greek",
    year: "c. 725 BC",
    description: "Ἄνδρα μοι ἔννεπε, Μοῦσα — the man of many ways",
  },
  {
    query: "De Rerum Natura Book I opening by Lucretius in Latin",
    title: "De Rerum Natura — Liber I",
    author: "Lucretius",
    language: "Latin",
    year: "c. 50 BC",
    description: "On the nature of things — Epicurean philosophy in verse",
  },
  {
    query: "Carmen I.1 Maecenas atavis by Horace in Latin",
    title: "Carmina — Liber I",
    author: "Horace",
    language: "Latin",
    year: "23 BC",
    description: "Odes in praise of the simple life and friendship",
  },
  {
    query: "Nicomachean Ethics Book I opening by Aristotle in Greek",
    title: "Ἠθικὰ Νικομάχεια — Book I",
    author: "Aristotle",
    language: "Greek",
    year: "c. 350 BC",
    description: "Every art and inquiry seems to aim at some good",
  },
  {
    query: "Les Fleurs du Mal opening poems by Baudelaire in French",
    title: "Les Fleurs du Mal",
    author: "Charles Baudelaire",
    language: "French",
    year: "1857",
    description: "Au lecteur — Hypocrite lecteur, mon semblable, mon frère",
  },
  {
    query: "Republica Book I opening by Plato in Ancient Greek",
    title: "Πολιτεία — Book I",
    author: "Plato",
    language: "Greek",
    year: "c. 380 BC",
    description: "On justice — Κατέβην χθὲς εἰς Πειραιᾶ",
  },
];

const LANGUAGE_ORDER = ["Latin", "Greek", "Italian", "French", "Spanish", "German", "Russian", "Japanese"];

function groupByLanguage(texts: CatalogText[]): Record<string, CatalogText[]> {
  const groups: Record<string, CatalogText[]> = {};
  for (const text of texts) {
    if (!groups[text.language]) groups[text.language] = [];
    groups[text.language].push(text);
  }
  return groups;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loadingQuery, setLoadingQuery] = useState<string | null>(null);

  const searchMutation = useSearchText();
  const { data: recentTexts } = useGetRecentTexts();
  const { data: allTexts } = useListTexts();
  const portal = useCreateBillingPortalSession();

  const handleManageBilling = () => {
    portal.mutate(undefined, {
      onSuccess: (data) => {
        if (data.url) window.location.href = data.url;
      },
      onError: () => toast({ title: "Could not open billing portal", variant: "destructive" }),
    });
  };

  const textByTitle = new Map((allTexts ?? []).map((t) => [t.title.toLowerCase(), t]));

  const normalizeLanguage = (lang: string): string => {
    const l = lang.trim();
    if (/^ancient\s+greek$/i.test(l) || /^greek$/i.test(l) || /^koine$/i.test(l)) return "Greek";
    return l.charAt(0).toUpperCase() + l.slice(1).toLowerCase();
  };

  const libraryByLanguage: Record<string, typeof allTexts extends (infer U)[] | undefined ? U[] : never> = {};
  for (const t of allTexts ?? []) {
    const lang = normalizeLanguage(t.language);
    if (!libraryByLanguage[lang]) libraryByLanguage[lang] = [];
    libraryByLanguage[lang].push(t);
  }
  for (const lang of Object.keys(libraryByLanguage)) {
    libraryByLanguage[lang].sort((a, b) => {
      const ya = a.publicationYear ?? Number.POSITIVE_INFINITY;
      const yb = b.publicationYear ?? Number.POSITIVE_INFINITY;
      if (ya !== yb) return ya - yb;
      return a.title.localeCompare(b.title);
    });
  }

  const formatYear = (y: number | null | undefined): string => {
    if (y === null || y === undefined) return "";
    if (y < 0) return `${Math.abs(y)} BCE`;
    if (y < 1000) return `${y} CE`;
    return String(y);
  };

  const handleSelect = (query: string, title?: string) => {
    if (searchMutation.isPending) return;
    if (title) {
      const existing = textByTitle.get(title.toLowerCase());
      if (existing) {
        setLocation(`/texts/${existing.id}/read/0`);
        return;
      }
    }
    setLoadingQuery(query);
    searchMutation.mutate(
      { data: { query } },
      {
        onSuccess: (data) => {
          setLocation(`/texts/${data.id}/read/0`);
        },
        onError: (err: unknown) => {
          setLoadingQuery(null);
          const apiErr = err as { status?: number; data?: { error?: string } | null };
          const serverMessage = apiErr?.data?.error;
          const status = apiErr?.status;
          if (status === 400 && serverMessage) {
            toast({
              title: "Not available",
              description: serverMessage,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Could not load text",
              description: serverMessage ?? "The text could not be retrieved. Please try again.",
              variant: "destructive",
            });
          }
        },
      }
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    handleSelect(searchQuery.trim());
  };

  const grouped = groupByLanguage(CATALOG);
  const isLoading = searchMutation.isPending;

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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManageBilling}
              disabled={portal.isPending}
              className="font-serif text-muted-foreground"
            >
              <CreditCard className="h-4 w-4 mr-1.5" />
              {portal.isPending ? "Opening…" : "Billing"}
            </Button>
            <UserButton />
          </div>
        </div>
      </header>

      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-center space-y-2">
            <p className="font-serif text-lg text-foreground">Retrieving text from the archives…</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              The first load takes up to 30 seconds while the original-language text is fetched and prepared.
              Subsequent visits are instant.
            </p>
          </div>
        </div>
      )}

      <main className="container max-w-5xl mx-auto px-4 py-10 space-y-14">
        <section className="text-center max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-primary tracking-tight">
            A quiet room for classical reading
          </h1>
          <p className="text-lg text-muted-foreground font-serif">
            Choose a text below to begin. Read slowly.
          </p>
        </section>

        {recentTexts && recentTexts.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-center gap-2 text-lg font-serif font-medium text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2>Continue Reading</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </section>
        )}

        <section className="space-y-4">
          {(allTexts ?? []).length === 0 ? (
            <div className="text-center text-muted-foreground font-serif py-12">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3 text-primary" />
              <p>Preparing the library…</p>
            </div>
          ) : (
            LANGUAGE_ORDER.filter((lang) => libraryByLanguage[lang]?.length).map((lang) => (
              <details key={lang} className="group rounded-lg border border-border/40 bg-card/20 overflow-hidden">
                <summary className="cursor-pointer list-none flex items-center justify-between px-4 py-3 hover:bg-card/40 transition-colors select-none">
                  <div className="flex items-baseline gap-3">
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-0 -rotate-90" />
                    <h2 className="font-serif text-lg font-semibold text-foreground">{lang}</h2>
                    <span className="text-xs font-mono text-muted-foreground/70">
                      {libraryByLanguage[lang].length} {libraryByLanguage[lang].length === 1 ? "book" : "books"}
                    </span>
                  </div>
                </summary>
                <div className="border-t border-border/30 divide-y divide-border/30">
                  {libraryByLanguage[lang].map((item) => (
                    <Link key={item.id} href={`/texts/${item.id}/read/0`}>
                      <div className="flex items-baseline gap-3 px-5 py-3 hover:bg-card/60 transition-colors cursor-pointer">
                        <span className="text-[11px] font-mono text-muted-foreground/60 w-20 shrink-0 tabular-nums">
                          {formatYear(item.publicationYear) || "—"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-serif font-medium text-sm text-foreground truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{item.author}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </details>
            ))
          )}
        </section>

        <section className="border-t border-border/40 pt-8">
          <button
            onClick={() => setShowSearch((v) => !v)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-serif"
          >
            {showSearch ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Search for a different text
          </button>

          {showSearch && (
            <form onSubmit={handleSearch} className="relative mt-4 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
                placeholder="e.g. Tacitus Annals Book I, Ronsard sonnets..."
                className="pl-11 pr-24 h-12 font-serif bg-card border-border/60 shadow-sm focus-visible:ring-primary/20 rounded-lg"
                autoFocus
              />
              <Button
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-5 bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-sm"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Find"}
              </Button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
