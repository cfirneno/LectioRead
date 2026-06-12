---
name: Lectio visit geo lookup
description: Which IP-geolocation provider works from the server and why; transport/PII constraint.
---

# Lectio visit geo lookup

Visit analytics enrich each new visit row with country/city via a server-side IP geolocation lookup (`geo.ts` `lookupGeo`). Best-effort: returns null on any failure or private IP, never blocks visit insert.

## Provider choice
Use **`https://freeipapi.com/api/json/<ip>`** (fields `countryName`/`cityName`). It works from Node's global `fetch` over HTTPS with no key.

**Why not the alternatives:**
- `ipwho.is` — works from shell `curl` but Node `fetch` gets `{success:false, message:"CORS is not supported on the Free plan"}` regardless of headers/params. Do not use from the server.
- `ip-api.com` — works from Node but **HTTP only** on the free plan. Sending visitor IPs (PII) in plaintext to a third party is a privacy flaw; rejected for that reason.
- `ipapi.co` — returned `{error:true}` for plain lookups.

**How to apply:** any future geo/IP-enrichment must use an HTTPS endpoint that accepts Node `fetch` — verify with `node -e "fetch(url)..."` (not just `curl`), since shell curl can succeed where Node fetch fails.

## Access level
`/visits/stats` (totals, bySource, byCountry aggregates) is intentionally PUBLIC — it backs the public `/stats` page. Per-visit detail (`/visits/recent`, includes path/referrer/country/city per row) is admin-gated. Keep aggregate vs per-visit on that split.
