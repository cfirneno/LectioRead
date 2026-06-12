import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SignIn, SignUp, useAuth } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import TextToc from "@/pages/text-toc";
import Read from "@/pages/read";
import Vocabulary from "@/pages/vocabulary";
import Flashcards from "@/pages/flashcards";
import Review from "@/pages/review";
import ContinueReading from "@/pages/continue";
import StartReading from "@/pages/start";
import Videos from "@/pages/videos";
import VideoWatch from "@/pages/video-watch";
import Support from "@/pages/support";
import SupportThanks from "@/pages/support-thanks";
import Educators from "@/pages/educators";
import CheckoutSuccess from "@/pages/checkout-success";
import Stats from "@/pages/stats";
import Dashboard from "@/pages/dashboard";
import { useTrackVisit } from "@/hooks/useTrackVisit";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const status = (error as { status?: number })?.status;
        // 401 can be transient (Clerk session warming up) — retry a few times.
        if (status === 401) return failureCount < 3;
        // Other 4xx are deterministic — don't retry.
        if (typeof status === "number" && status >= 400 && status < 500) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 3000),
    },
  },
});

function FullPageSpinner() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

// Reading is free for everyone. Sign-in is only required for features that
// store per-user data: continue, review, vocabulary, flashcards.
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <FullPageSpinner />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <>{children}</>;
}

function HomeOrLanding() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <FullPageSpinner />;
  if (isSignedIn) return <Redirect to="/app" />;
  return <Landing />;
}

function ClerkBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 py-12">
      {children}
    </div>
  );
}

function SignInPage() {
  const [location] = useLocation();
  return (
    <ClerkBox>
      <SignIn routing="path" path={location.startsWith("/sign-in") ? "/sign-in" : "/sign-in"} signUpUrl="/sign-up" />
    </ClerkBox>
  );
}

function SignUpPage() {
  return (
    <ClerkBox>
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </ClerkBox>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomeOrLanding} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-in/:rest*" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route path="/sign-up/:rest*" component={SignUpPage} />
      <Route path="/subscribe">
        <Redirect to="/support" />
      </Route>
      <Route path="/support" component={Support} />
      <Route path="/support/thanks" component={SupportThanks} />
      <Route path="/educators" component={Educators} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/stats" component={Stats} />
      <Route path="/dashboard">
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      </Route>
      <Route path="/app" component={Home} />
      <Route path="/app/continue">
        <RequireAuth>
          <ContinueReading />
        </RequireAuth>
      </Route>
      <Route path="/app/start/:catalogKey" component={StartReading} />
      <Route path="/app/review">
        <RequireAuth>
          <Review />
        </RequireAuth>
      </Route>
      <Route path="/app/videos" component={Videos} />
      <Route path="/app/videos/:slug" component={VideoWatch} />
      <Route path="/texts/:textId/read/:index" component={Read} />
      <Route path="/texts/:textId/vocabulary">
        <RequireAuth>
          <Vocabulary />
        </RequireAuth>
      </Route>
      <Route path="/texts/:textId/flashcards">
        <RequireAuth>
          <Flashcards />
        </RequireAuth>
      </Route>
      <Route path="/texts/:textId" component={TextToc} />
      <Route component={NotFound} />
    </Switch>
  );
}

function VisitTracker() {
  useTrackVisit();
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <VisitTracker />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
