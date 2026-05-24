import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetSubscriptionStatus } from "@workspace/api-client-react";
import { Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();
  const [attempts, setAttempts] = useState(0);
  const { data, refetch } = useGetSubscriptionStatus({
    query: { refetchInterval: 1500 } as never,
  });

  useEffect(() => {
    if (data?.active) {
      const t = setTimeout(() => setLocation("/app"), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setAttempts((a) => a + 1);
      void refetch();
    }, 1500);
    return () => clearTimeout(t);
  }, [data, refetch, setLocation]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-6 text-center px-4">
      <BookOpen className="h-12 w-12 text-primary" />
      {data?.active ? (
        <>
          <h1 className="font-serif text-3xl text-primary">Welcome to Lectio.</h1>
          <p className="text-muted-foreground font-serif">Taking you to your library…</p>
        </>
      ) : (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <h1 className="font-serif text-2xl text-primary">Activating your subscription…</h1>
          <p className="text-muted-foreground font-serif max-w-md">
            This usually takes a few seconds while we confirm with Stripe.
          </p>
          {attempts > 8 && (
            <Button onClick={() => setLocation("/app")} variant="outline" className="font-serif">
              Continue to library
            </Button>
          )}
        </>
      )}
    </div>
  );
}
