import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useListTexts } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

export default function StartReading() {
  const params = useParams();
  const [, navigate] = useLocation();
  const rawKey = params.catalogKey ?? "";
  let catalogKey = rawKey;
  try {
    catalogKey = decodeURIComponent(rawKey);
  } catch {
    catalogKey = rawKey;
  }
  const { data: texts, isLoading, isError } = useListTexts();

  useEffect(() => {
    if (isLoading) return;

    const match = texts?.find((t) => t.catalogKey === catalogKey);
    if (match) {
      navigate(`/texts/${match.id}/read/0`, { replace: true });
    } else if (isError || texts) {
      navigate("/app", { replace: true });
    }
  }, [texts, isLoading, isError, catalogKey, navigate]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 bg-background text-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="font-serif text-muted-foreground">Opening your reading…</p>
    </div>
  );
}
