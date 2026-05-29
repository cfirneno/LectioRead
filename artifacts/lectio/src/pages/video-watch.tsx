import { useRef } from "react";
import { Link, useParams, Redirect } from "wouter";
import { BookOpen, ArrowLeft, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VIDEOS, getVideoBySlug } from "@/lib/videos";

export default function VideoWatch() {
  const params = useParams();
  const video = getVideoBySlug(params.slug);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  if (!video) {
    return <Redirect to="/app/videos" />;
  }

  const goFullscreen = () => {
    const el = frameRef.current as
      | (HTMLIFrameElement & { webkitRequestFullscreen?: () => void })
      | null;
    if (!el) return;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
  };

  const fullscreenSupported =
    typeof document !== "undefined" &&
    (document.fullscreenEnabled || "webkitRequestFullscreen" in document.createElement("iframe"));

  const others = VIDEOS.filter((v) => v.slug !== video.slug);

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
          <Link href="/app/videos">
            <Button variant="ghost" size="sm" className="font-serif text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              All Videos
            </Button>
          </Link>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {video.subtitle}
          </p>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-primary tracking-tight">
            {video.title}
          </h1>
          <p className="text-muted-foreground pt-1">{video.description}</p>
        </div>

        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-black shadow-sm">
            <div className="aspect-video w-full">
              <iframe
                ref={frameRef}
                src={video.src}
                title={video.title}
                className="h-full w-full border-0"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
          {fullscreenSupported && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" className="font-serif" onClick={goFullscreen}>
                <Maximize className="h-4 w-4 mr-1.5" />
                Fullscreen
              </Button>
            </div>
          )}
        </div>

        {others.length > 0 && (
          <section className="space-y-3 pt-2">
            <h2 className="font-serif text-lg font-semibold text-foreground">More videos</h2>
            <div className="flex flex-wrap gap-3">
              {others.map((v) => (
                <Link key={v.slug} href={`/app/videos/${v.slug}`}>
                  <Button variant="outline" size="sm" className="font-serif">
                    {v.title}
                  </Button>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
