import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SignIn, SignUp, useAuth } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetSubscriptionStatus } from "@workspace/api-client-react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import TextToc from "@/pages/text-toc";
import Read from "@/pages/read";
import Vocabulary from "@/pages/vocabulary";
import Flashcards from "@/pages/flashcards";
import Review from "@/pages/review";
import Videos from "@/pages/videos";
import VideoWatch from "@/pages/video-watch";
import Subscribe from "@/pages/subscribe";
import CheckoutSuccess from "@/pages/checkout-success";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const status = (error as { status?: number })?.status;
        // 402 = subscription required — never retry; user must subscribe.
        if (status === 402) return false;
        // 401 can be transient (Clerk session warming up) — retry a few times.
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

function RequireSubscription({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const enabled = isLoaded && !!isSignedIn;
  const { data, isLoading } = useGetSubscriptionStatus({
    query: { enabled } as never,
  });

  if (!isLoaded) return <FullPageSpinner />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if (isLoading || !data) return <FullPageSpinner />;
  if (!data.active) return <Redirect to="/subscribe" />;
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
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/app">
        <RequireSubscription>
          <Home />
        </RequireSubscription>
      </Route>
      <Route path="/app/review">
        <RequireSubscription>
          <Review />
        </RequireSubscription>
      </Route>
      <Route path="/app/videos">
        <RequireSubscription>
          <Videos />
        </RequireSubscription>
      </Route>
      <Route path="/app/videos/:slug">
        <RequireSubscription>
          <VideoWatch />
        </RequireSubscription>
      </Route>
      <Route path="/texts/:textId/read/:index">
        <RequireSubscription>
          <Read />
        </RequireSubscription>
      </Route>
      <Route path="/texts/:textId/vocabulary">
        <RequireSubscription>
          <Vocabulary />
        </RequireSubscription>
      </Route>
      <Route path="/texts/:textId/flashcards">
        <RequireSubscription>
          <Flashcards />
        </RequireSubscription>
      </Route>
      <Route path="/texts/:textId">
        <RequireSubscription>
          <TextToc />
        </RequireSubscription>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
