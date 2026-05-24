import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth, UserButton } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Check, Loader2 } from "lucide-react";
import { useCreateCheckoutSession, useGetSubscriptionStatus } from "@workspace/api-client-react";

export default function Subscribe() {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const canceled = new URLSearchParams(search).get("canceled") === "1";
  const [submitting, setSubmitting] = useState(false);
  const checkout = useCreateCheckoutSession();
  const { data: status } = useGetSubscriptionStatus({
    query: { enabled: !!isSignedIn } as never,
  });

  if (isLoaded && !isSignedIn) {
    setLocation("/sign-in");
    return null;
  }

  if (status?.active) {
    setLocation("/app");
    return null;
  }

  const handleSubscribe = () => {
    setSubmitting(true);
    checkout.mutate(undefined, {
      onSuccess: (data) => {
        if (data.url) window.location.href = data.url;
        else setSubmitting(false);
      },
      onError: () => setSubmitting(false),
    });
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
          {isSignedIn && <UserButton />}
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-16 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-serif font-semibold text-primary">One last step</h1>
          <p className="text-muted-foreground font-serif">
            Subscribe to start reading. $1/month, cancel anytime.
          </p>
        </div>

        {canceled && (
          <div className="rounded-md border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground text-center">
            Checkout was canceled. You can try again whenever you're ready.
          </div>
        )}

        <Card>
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-1">
              <div className="font-serif text-5xl font-semibold text-primary">$1<span className="text-xl text-muted-foreground">/month</span></div>
              <div className="text-sm text-muted-foreground">Charged today, then monthly. Cancel anytime.</div>
            </div>

            <ul className="space-y-3 text-sm font-serif">
              {[
                "Full library of public-domain classical texts",
                "5-stage progressive reading cycle",
                "Word-by-word interlinear translations",
                "Search any text by title or author",
                "Per-paragraph progress tracking",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={handleSubscribe}
              disabled={submitting || checkout.isPending}
              className="w-full h-12 font-serif text-base"
              size="lg"
            >
              {submitting || checkout.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Subscribe — $1.00 today"
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Secure checkout by Stripe. You'll be redirected to complete payment.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
