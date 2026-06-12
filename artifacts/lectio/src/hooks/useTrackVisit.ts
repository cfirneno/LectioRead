import { useEffect, useRef } from "react";
import { useRecordVisit } from "@workspace/api-client-react";

const VISITOR_KEY = "lectio_visitor_id";
const SOURCE_KEY = "lectio_visit_source";

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/**
 * Reads a campaign tag from the URL (?from=, ?source=, or ?utm_source=) and
 * remembers it for this browser so later in-app navigations stay attributed to
 * the same source. Returns null when no tag has ever been seen.
 */
function getSource(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("from") || params.get("source") || params.get("utm_source");
    if (fromUrl) {
      const clean = fromUrl.trim().slice(0, 64);
      if (clean) {
        sessionStorage.setItem(SOURCE_KEY, clean);
        return clean;
      }
    }
    return sessionStorage.getItem(SOURCE_KEY);
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget: records a single site visit per page load. Public endpoint,
 * so it works for anonymous visitors on the landing page too. Failures are
 * swallowed — tracking must never disrupt the user experience.
 */
export function useTrackVisit(): void {
  const { mutate } = useRecordVisit();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    mutate({
      data: {
        visitorId: getVisitorId(),
        path: window.location.pathname,
        referrer: document.referrer || null,
        source: getSource(),
      },
    });
  }, [mutate]);
}
