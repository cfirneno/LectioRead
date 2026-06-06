import { Link } from "wouter";
import { useGetVisitStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Eye, Users, Clock, CalendarDays, Loader2 } from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-serif font-semibold text-foreground">
          {value.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Stats() {
  const { data, isLoading, isError } = useGetVisitStats();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="border-b border-border/40">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-semibold text-primary">
            <BookOpen className="h-6 w-6" />
            <span>Lectio</span>
          </Link>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-12">
        <h1 className="font-serif text-3xl font-semibold mb-2">Site visits</h1>
        <p className="text-muted-foreground mb-8">
          Every visit to the site is counted, including anonymous visitors.
        </p>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : isError || !data ? (
          <p className="text-destructive">Couldn’t load visit stats. Please try again.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard label="Total visits" value={data.total} icon={Eye} />
            <StatCard label="Unique visitors" value={data.uniqueVisitors} icon={Users} />
            <StatCard label="Last 24 hours" value={data.last24h} icon={Clock} />
            <StatCard label="Last 7 days" value={data.last7d} icon={CalendarDays} />
          </div>
        )}

        <div className="mt-10">
          <Link href="/">
            <Button variant="outline" className="font-serif">
              Back to home
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
