import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Heart } from "lucide-react";

export default function SupportThanks() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="border-b border-border/40">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 font-serif text-2xl font-semibold text-primary cursor-pointer">
              <BookOpen className="h-6 w-6" />
              <span>Lectio</span>
            </div>
          </Link>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary">
          <Heart className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-4xl font-serif font-semibold text-primary">Thank you</h1>
        <p className="text-lg text-muted-foreground font-serif max-w-lg mx-auto leading-relaxed">
          Your gift means a great deal. It goes directly into adding more works,
          more languages, and new features — and into keeping Lectio free for
          every reader. Now, back to the books.
        </p>
        <div className="pt-2">
          <Link href="/app">
            <Button size="lg" className="font-serif">
              Back to reading
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
