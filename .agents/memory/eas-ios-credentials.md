---
name: EAS iOS credentials wall
description: Why iOS builds always need a human at a terminal once, and the cleanest path through.
---

When EAS Build needs to generate (or upload) iOS Distribution Certificates and Provisioning Profiles, it logs in to **developer.apple.com** via Fastlane's Spaceship. This sign-in requires the real Apple ID password plus a 2FA challenge (device push or SMS).

What does NOT work for this sign-in:
- App-specific passwords — rejected as "invalid username and password".
- ASC API key alone — Expo dashboard shows "Team: None / Role: None" because the API key cannot enumerate teams without sufficient role (and even Admin role does not unlock Developer Portal cert generation).
- Driving the wizard from Replit/CI — Apple's 2FA push needs a trusted device the human owns.

**Why:** Apple's security model requires the human owner of the developer account to personally authorize each new signing cert. There is no documented bypass.

**How to apply:** First successful build for any new Apple Developer account must be done from a machine the user controls (Mac, or any machine with working Node) with their iPhone/Mac nearby for 2FA. After credentials are generated and stored in EAS, all future builds from Replit/CI succeed non-interactively.

Working flow that finally cleared the wall:
1. On user's Mac: `cd <repo> && ~/.npm-global/bin/pnpm install` (avoid corepack — see related memory).
2. `cd artifacts/<mobile-artifact> && npx eas-cli@latest credentials`.
3. Wizard → iOS → production profile → "Y" to Apple login → "device" 2FA → "Build Credentials" → "All: Set up all".
4. EAS generates the cert + profile on Apple's servers and stores them in the EAS project.
5. Then `npx eas-cli@latest build -p ios -e production` works.

Common red herring: the `expo-updates` prompt during `eas build` — say **no** unless OTA updates are actually wanted; saying yes adds a package and config that can break the build.
