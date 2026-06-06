import { useEffect, useRef } from "react";
import { useRecordVisit } from "@workspace/api-client-react";

const VISITOR_KEY = "lectio_visitor_id";

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
      },
    });
  }, [mutate]);
}
