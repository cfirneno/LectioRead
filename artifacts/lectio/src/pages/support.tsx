import { useState } from "react";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Heart, Loader2 } from "lucide-react";
import { useCreateDonationCheckout } from "@workspace/api-client-react";

const PRESETS = [3, 5, 10, 25, 50];

export default function Support() {
  const search = useSearch();
  const canceled = new URLSearchParams(search).get("canceled") === "1";
  const [amount, setAmount] = useState<number>(10);
  const [custom, setCustom] = useState("");
  const donate = useCreateDonationCheckout();

  const customValue = parseFloat(custom);
  const hasCustom = custom.trim() !== "" && Number.isFinite(customValue) && customValue > 0;
  const effectiveDollars = hasCustom ? customValue : amount;
  const valid = Number.isFinite(effectiveDollars) && effectiveDollars >= 1 && effectiveDollars <= 10000;

  const handleDonate = () => {
    if (!valid) return;
    const amountCents = Math.round(effectiveDollars * 100);
    donate.mutate(
      { data: { amountCents } },
      {
        onSuccess: (data) => {
          if (data.url) window.location.href = data.url;
        },
      }
    );
  };

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
          <Link href="/app">
            <Button variant="ghost" size="sm" className="font-serif text-muted-foreground">
              Back to reading
            </Button>
          </Link>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-16 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-4xl font-serif font-semibold text-primary">Support Lectio</h1>
          <p className="text-muted-foreground font-serif max-w-lg mx-auto leading-relaxed">
            Lectio is free for everyone — all texts, all features, no ads, no
            tracking, no paywall. If it's useful to you, a one-time gift of any
            size helps keep it running and growing. No account required.
          </p>
        </div>

        {canceled && (
          <div className="rounded-md border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground text-center">
            No problem — your donation was canceled and you weren't charged.
          </div>
        )}

        <Card>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PRESETS.map((preset) => {
                const active = !hasCustom && amount === preset;
                return (
                  <Button
                    key={preset}
                    type="button"
                    variant={active ? "default" : "outline"}
                    className="font-serif text-base h-12"
                    onClick={() => {
                      setAmount(preset);
                      setCustom("");
                    }}
                  >
                    ${preset}
                  </Button>
                );
              })}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-serif text-muted-foreground">Or enter a custom amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-serif">$</span>
                <Input
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  inputMode="decimal"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="Custom"
                  className="pl-7 h-12 font-serif"
                />
              </div>
            </div>

            <Button
              onClick={handleDonate}
              disabled={!valid || donate.isPending}
              className="w-full h-12 font-serif text-base"
              size="lg"
            >
              {donate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `Donate $${effectiveDollars % 1 === 0 ? effectiveDollars : effectiveDollars.toFixed(2)}`
              )}
            </Button>

            {donate.isError && (
              <p className="text-sm text-destructive text-center">
                Something went wrong starting checkout. Please try again.
              </p>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Secure one-time payment by Stripe. You'll be redirected to complete it.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
