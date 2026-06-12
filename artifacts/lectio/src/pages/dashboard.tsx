import { Link } from "wouter";
import {
  useGetVisitStats,
  useGetRecentVisits,
  useGetOutreachRecipients,
  useGetAdminStatus,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Eye,
  Users,
  Clock,
  CalendarDays,
  Loader2,
  Megaphone,
  Mail,
  Activity,
  Lock,
} from "lucide-react";

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

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function describeReferrer(referrer: string | null): string {
  if (!referrer) return "Direct";
  try {
    const u = new URL(referrer);
    const host = u.hostname.replace(/^www\./, "");
    if (host.includes("lectioread.com") || host.includes("replit.dev")) {
      return `On site (${u.pathname})`;
    }
    return host;
  } catch {
    return referrer;
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="border-b border-border/40">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-serif text-2xl font-semibold text-primary"
          >
            <BookOpen className="h-6 w-6" />
            <span>Lectio</span>
          </Link>
        </div>
      </header>
      <main className="container max-w-5xl mx-auto px-4 py-12">{children}</main>
    </div>
  );
}

export default function Dashboard() {
  const admin = useGetAdminStatus();
  const isAdmin = admin.data?.admin === true;

  const stats = useGetVisitStats({ query: { enabled: isAdmin } as never });
  const recent = useGetRecentVisits({ query: { enabled: isAdmin } as never });
  const outreach = useGetOutreachRecipients({ query: { enabled: isAdmin } as never });

  if (admin.isLoading) {
    return (
      <Shell>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading…
        </div>
      </Shell>
    );
  }

  if (!isAdmin) {
    return (
      <Shell>
        <div className="max-w-md">
          <div className="flex items-center gap-2 font-serif text-2xl font-semibold mb-2">
            <Lock className="h-6 w-6 text-muted-foreground" />
            Private dashboard
          </div>
          <p className="text-muted-foreground mb-6">
            This page is restricted to the site owner. Your account isn’t authorized to view it.
          </p>
          <Link href="/">
            <Button variant="outline" className="font-serif">
              Back to home
            </Button>
          </Link>
        </div>
      </Shell>
    );
  }

  const loading = stats.isLoading || recent.isLoading || outreach.isLoading;
  const recipients = outreach.data?.recipients ?? [];
  const visits = recent.data?.visits ?? [];

  return (
    <Shell>
      <>
        <h1 className="font-serif text-3xl font-semibold mb-2">Outreach &amp; visits dashboard</h1>
        <p className="text-muted-foreground mb-8">
          Who the announcement was emailed to, and who is visiting the site — with times.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : (
          <>
            {stats.data && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total visits" value={stats.data.total} icon={Eye} />
                <StatCard label="Unique visitors" value={stats.data.uniqueVisitors} icon={Users} />
                <StatCard label="Last 24 hours" value={stats.data.last24h} icon={Clock} />
                <StatCard label="Last 7 days" value={stats.data.last7d} icon={CalendarDays} />
              </div>
            )}

            {/* Where visits come from */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif text-xl">
                  <Megaphone className="h-5 w-5 text-muted-foreground" />
                  Where visits come from
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!stats.data?.bySource || stats.data.bySource.length === 0 ? (
                  <p className="text-muted-foreground">No visits recorded yet.</p>
                ) : (
                  <div className="overflow-hidden rounded-md border border-border/60">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/60 bg-muted/40 text-left text-muted-foreground">
                          <th className="px-4 py-2 font-medium">Source</th>
                          <th className="px-4 py-2 font-medium text-right">Visits</th>
                          <th className="px-4 py-2 font-medium text-right">Unique</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.data.bySource.map((row) => (
                          <tr key={row.source} className="border-b border-border/40 last:border-0">
                            <td className="px-4 py-2 font-medium">
                              {row.source === "direct" ? "Direct / untagged" : row.source}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums">
                              {row.visits.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums">
                              {row.uniqueVisitors.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                  Tag any link with <code className="rounded bg-muted px-1 py-0.5">?from=name</code> to
                  track it here — e.g.{" "}
                  <code className="rounded bg-muted px-1 py-0.5">lectioread.com/?from=outreach</code>.
                </p>
              </CardContent>
            </Card>

            {/* Recent visits */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif text-xl">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  Recent visits
                </CardTitle>
              </CardHeader>
              <CardContent>
                {visits.length === 0 ? (
                  <p className="text-muted-foreground">No visits recorded yet.</p>
                ) : (
                  <div className="overflow-hidden rounded-md border border-border/60">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/60 bg-muted/40 text-left text-muted-foreground">
                          <th className="px-4 py-2 font-medium">When</th>
                          <th className="px-4 py-2 font-medium">Source</th>
                          <th className="px-4 py-2 font-medium">Came from</th>
                          <th className="px-4 py-2 font-medium">Page</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visits.map((v) => (
                          <tr key={v.id} className="border-b border-border/40 last:border-0">
                            <td className="px-4 py-2 whitespace-nowrap tabular-nums">
                              {formatWhen(v.at)}
                            </td>
                            <td className="px-4 py-2">
                              {v.source ? (
                                <span className="font-medium">{v.source}</span>
                              ) : (
                                <span className="text-muted-foreground">Untagged</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {describeReferrer(v.referrer)}
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">{v.path}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                  Showing the {visits.length.toLocaleString()} most recent visits. Times are in your
                  local timezone.
                </p>
              </CardContent>
            </Card>

            {/* Educators contacted */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif text-xl">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  Educators contacted ({recipients.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recipients.length === 0 ? (
                  <p className="text-muted-foreground">No outreach recorded.</p>
                ) : (
                  <div className="overflow-hidden rounded-md border border-border/60">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/60 bg-muted/40 text-left text-muted-foreground">
                          <th className="px-4 py-2 font-medium">Institution</th>
                          <th className="px-4 py-2 font-medium">Department</th>
                          <th className="px-4 py-2 font-medium">Email</th>
                          <th className="px-4 py-2 font-medium">Sent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recipients.map((r) => (
                          <tr key={r.email} className="border-b border-border/40 last:border-0">
                            <td className="px-4 py-2 font-medium whitespace-nowrap">
                              {r.institution}
                              <span className="ml-1 text-xs text-muted-foreground">({r.country})</span>
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">{r.department}</td>
                            <td className="px-4 py-2 text-muted-foreground">{r.email}</td>
                            <td className="px-4 py-2 whitespace-nowrap tabular-nums">
                              {formatWhen(r.sentAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                  The announcement was emailed to these mailboxes. To see which of them drives visits,
                  send follow-ups with a tagged link like{" "}
                  <code className="rounded bg-muted px-1 py-0.5">lectioread.com/?from=harvard</code>.
                </p>
              </CardContent>
            </Card>
          </>
        )}

        <div className="mt-10">
          <Link href="/">
            <Button variant="outline" className="font-serif">
              Back to home
            </Button>
          </Link>
        </div>
      </>
    </Shell>
  );
}
