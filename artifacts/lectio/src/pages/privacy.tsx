import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

const UPDATED = "June 12, 2026";

export default function Privacy() {
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

      <main className="container max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-serif font-semibold text-primary mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground font-serif mb-10">Last updated {UPDATED}</p>

        <div className="space-y-8 font-serif text-foreground/90 leading-relaxed">
          <section className="space-y-2">
            <p>
              Lectio is a free reader for learning classical languages, available on
              the web and as an iOS app. This policy explains what we collect and how
              we use it. We keep this short because we collect very little.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-primary">Reading without an account</h2>
            <p>
              You can read every text on Lectio without creating an account or signing
              in. When you read without an account, we do not collect any personal
              information that identifies you.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-primary">When you create an account</h2>
            <p>
              Creating an account is optional and only needed to save your reading
              progress and use quizzes and review. Accounts are handled by our
              authentication provider, Clerk. When you sign up we store your email
              address and the reading progress and quiz results tied to your account.
              We do not store your password — that is managed securely by Clerk.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-primary">How we use your information</h2>
            <p>
              We use your email to identify your account and your saved data to show
              your progress, vocabulary, and review items across devices. We do not
              sell your data, we do not show ads, and we do not use third-party
              advertising or tracking.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-primary">Translations and AI</h2>
            <p>
              Interlinear and full translations are generated with OpenAI's API and
              cached so they need not be regenerated. Only the public-domain text being
              translated is sent for this purpose; your personal information is not.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-primary">Donations</h2>
            <p>
              Donations are optional and processed by Stripe. Payment details are
              handled entirely by Stripe; Lectio never sees or stores your card
              information.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-primary">Deleting your account</h2>
            <p>
              You can delete your account at any time — in the iOS app, open the
              account menu and choose “Delete account.” Deleting your account
              permanently removes your email and all saved progress and quiz data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-primary">Children</h2>
            <p>
              Lectio is intended for a general audience and is not directed at children
              under 13. We do not knowingly collect personal information from children
              under 13.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-primary">Contact</h2>
            <p>
              Questions about this policy? Email{" "}
              <a className="text-primary underline" href="mailto:hello@lectioread.com">
                hello@lectioread.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
