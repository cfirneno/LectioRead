import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import App from "./App";
import "./index.css";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

createRoot(document.getElementById("root")!).render(
  <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    signInUrl="/sign-in"
    signUpUrl="/sign-up"
    signInFallbackRedirectUrl="/app"
    signUpFallbackRedirectUrl="/app"
    appearance={{
      variables: {
        colorPrimary: "hsl(8, 50%, 35%)",
        fontFamily: "'Inter', sans-serif",
        borderRadius: "0.3rem",
      },
    }}
  >
    <App />
  </ClerkProvider>,
);
