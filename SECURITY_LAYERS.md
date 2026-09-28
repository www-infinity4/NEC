# NEC wallet security layers and upstream shortlist

This is a build checklist, not a claim that NEC checkout is live. Do not count cloned repositories as independent security gates. Keep upstream patches flowing; fork only to make a specific reviewed change. Do not write a new cryptographic algorithm.

## Everyday wallet experience

The same browser/device wallet opens automatically for viewing, collecting, and ordinary use. No fingerprint prompt on every page load or every small action. A fingerprint on the phone can unlock a passkey; the server verifies the passkey's cryptographic response and never receives a fingerprint image. Passkeys are an optional way to protect recovery and authorize higher-risk transfers.

For a transfer, show the buyer the exact item, seller wallet label, selected assets, amount, and recipient, then require a deliberate **Confirm transfer** action. A known device can use a normal confirmation for low-risk transfers. Ask for a passkey/device unlock when adding a device, recovering access, changing payout or recovery details, or when a transfer crosses a configurable risk/amount threshold. Provide a simple freeze and dispute path if an unfamiliar transaction appears. Keep thresholds server-side and do not claim a fingerprint alone identifies the natural person using a shared device.

## The debit invariant

The balance is a **derived view of server-owned ledger entries**, never a mutable number in a browser file. For each asset, the backend must validate buyer identity, listing and recipient, available balance, and a unique idempotency key. Within one D1 database, a transaction writes matching debit and credit entries and a receipt, or none of them. SQL constraints/triggers reject negative balances and ownership changes that do not match the buyer. The client cannot submit its own balance or edit an earlier event. Music Quant ownership uses one owner row per Quant; a transfer conditionally updates the current owner and writes the transfer receipt in the same D1 transaction. Ordinary Quants use balanced signed entries. StarCoin spendable balances need an integer hundredth-unit ledger; share progress stays separate.

StarCoins currently live in a different D1 database from Quants. D1 cannot make one transaction span both databases. NEC needs a durable checkout journal, reservation or escrow states, idempotent steps, automatic reconciliation, and a hold on delivery until both legs are settled. Every retry must return the same transaction outcome. A failed or interrupted mixed payment must be repaired or compensated, never quietly marked complete.

A hash chain is useful to detect altered history, but an attacker with database write access could rewrite the chain. Export signed daily checkpoints to a separately controlled location, preserve D1 Time Travel, and compare totals and ownership to the checkpoint. Recovery must use audited correction entries; do not silently edit the historical balance.

## Layers to implement

1. One Cloudflare account ID shared by all Infinity sites; explicit device binding and revocation.
2. Passkeys for new-device binding and high-risk transfers, with optional email plus recovery code.
3. Short-lived, purpose-bound transfer authorization showing item, seller, assets, exact amounts, and recipient; routine confirmation stays simple, with device unlock for higher-risk changes.
4. Server-side authorization of **every** debit and owner change; never trust a wallet ID supplied by a page.
5. Seller-owned listing registry and exact server-calculated quote; arbitrary page text cannot start a charge.
6. Unique idempotency keys and replay detection for quotes, purchase intents, and each ledger leg.
7. Integer units only: Quant count and StarCoin hundredths; no floating-point balance updates.
8. Atomic double-entry inside one D1 database, SQL checks and overdraft/owner constraints.
9. Durable cross-database settlement journal with timeout, retry, compensation, and reconciliation.
10. Transfer limits, velocity limits, device-change hold, and a user-visible freeze/revoke control.
11. Rate limits and bot checks on recovery and purchase attempts; they supplement authentication.
12. Strict origin/CORS, CSP, input validation, scoped Worker bindings, and secrets outside client code.
13. Read-only balance projection from ledger; no direct browser write path to D1.
14. Receipt with transaction ID, parties, listing, asset IDs/units, status, and timestamps.
15. Audit events for denial, credential change, freeze, reversal, deployment, and reconciliation.
16. Daily signed reconciliation checkpoint outside the write account; alert on a mismatch.
17. D1 Time Travel and an independently controlled export; drill restore to a separate environment.
18. Two-person review for production Worker/binding changes and branch protection.
19. Dependency pinning, vulnerability scans, source review, and signed build provenance.
20. Tests for duplicate clicks, concurrent spend, stolen token, wrong owner, forged quote, lost response, partial D1 failure, and recovery abuse.

Alerts can freeze a wallet and preserve evidence for review. NEC must not claim a law-enforcement response or automatic attribution to a person.

## Upstream projects worth evaluating

| Upstream | Role | Adopt as |
|---|---|---|
| [MasterKale/SimpleWebAuthn](https://github.com/MasterKale/SimpleWebAuthn) (MIT) | Passkey registration and verification | Maintained dependency; fork only for a reviewed patch |
| [panva/jose](https://github.com/panva/jose) (MIT) | Signed, short-lived purchase intent and receipt tokens | Maintained dependency; avoid custom JWT code |
| [yeojz/otplib](https://github.com/yeojz/otplib) | Optional TOTP recovery factor | Evaluate only if passkey/recovery code flow needs it; verify license/version |
| [cloudflare/turnstile-demo-workers](https://github.com/cloudflare/turnstile-demo-workers) | Recovery and abuse challenge example | Reference; always validate token server-side |
| [OWASP/ASVS](https://github.com/OWASP/ASVS) | Security acceptance checklist | Reference standard, not runtime middleware |
| [OWASP/CheatSheetSeries](https://github.com/OWASP/CheatSheetSeries) | Authorization, transaction, session and recovery guidance | Reference; map each requirement to a test |
| [open-policy-agent/opa](https://github.com/open-policy-agent/opa) | Explicit transfer policy for asset types and limits | Evaluate if rules outgrow simple Worker checks; not a substitute for ownership SQL |
| [sigstore/sigstore-js](https://github.com/sigstore/sigstore-js) (Apache-2.0) | Build artifact provenance | CI/deployment check |
| [anchore/syft](https://github.com/anchore/syft) (Apache-2.0) | Dependency inventory/SBOM | CI report |
| [aquasecurity/trivy](https://github.com/aquasecurity/trivy) (Apache-2.0) | Known vulnerability scan | CI gate |
| [semgrep/semgrep](https://github.com/semgrep/semgrep) (LGPL-2.1) | Static checks for auth/SQL hazards | CI scan; review rule license if forking |
| [cloudflare/workers-sdk](https://github.com/cloudflare/workers-sdk) | Worker deployment tooling | Reference for pinning and deployment, not a separate security wall |

Check each upstream's current license, maintenance, advisories, and compatibility before copying code or creating a fork. The first four controls to implement are ledger invariants, account recovery, transaction authorization, and reconciliation. Adding more libraries before these exist expands the attack surface.

## Current release gate

NEC has price selection code and documentation. It does **not** have a live authenticated checkout or safe mixed-asset settlement. No page should offer a working Buy button until a two-account test proves both balances and ownership changed together and the retry/partial-failure cases reconcile.
