---
name: Lectio mobile Apple App Review compliance
description: What the iOS app must NOT do to pass Apple review (5.1.1), learned from a rejection.
---

# Lectio iOS (Expo + Clerk) App Review rules

The TestFlight build was rejected under Guideline 5.1.1. Two root causes, both fixed in code:

1. **Do not gate publicly-available content behind login.** The website's reading
   content (texts, table of contents, paragraphs, interlinear/full translations) is
   fully public — the server uses `attachOptionalUser` on those routes so they work
   for guests. The mobile app must mirror this: Home/Library, the per-text TOC
   (`text/[id]/index.tsx`), and the reader (`text/[id]/read/[index].tsx`) must render
   for guests with NO sign-in redirect.
   **Why:** Apple rejects apps that require an account just to access content that is
   otherwise free/public on the web.
   **How to apply:** Only gate genuinely auth-required server features behind sign-in.
   Those are the routes that require auth on the API: `/progress`,
   `/texts/:textId/stats`, `/texts/:textId/vocabulary`, and the entire quiz router
   (incl. `/review`). For those, show a graceful prompt (`components/SignInGate.tsx`),
   never a hard `<Redirect>`. Reading "I got it" should advance for guests and only
   save progress when signed in.

2. **Apps with account creation must offer in-app account deletion (5.1.1(v)).**
   Implemented via Clerk `useUser().user?.delete()` behind a confirm Alert in the
   Home header account menu (Sign out / Delete account).

## Demo account for Beta App Review
A TestFlight Beta App Review rejection was also caused by **no demo credentials**:
"Sign-in required" was on but the Sign-In Information box was blank, so the reviewer
couldn't get past login. Always provide a working account (login features still exist:
quizzes/review/progress). The demo account email is `charles@risxsci.com`; the account
already existed, so the password was set via the Clerk Backend API
(`PATCH api.clerk.com/v1/users/{id}` with `CLERK_SECRET_KEY`, `skip_password_checks:true`).
Backend-created/updated accounts are auto-verified. Never store the password here.

## Now fixed in code
- Privacy Policy page added at web route `/privacy` (`artifacts/lectio/src/pages/privacy.tsx`)
  → live URL `https://lectioread.com/privacy` after the web app is published.

## Charles must still do manually in App Store Connect / Expo
- Paste the demo email+password into TestFlight → Beta App Review → Sign-In Information.
- Paste the Privacy Policy URL, fill Contact Info + Review Notes.
- Rebuild the iOS app (buildNumber bumped to 4 in app.json) via EAS and resubmit.
- Age rating + category are App Store Connect metadata fields, not app code.
