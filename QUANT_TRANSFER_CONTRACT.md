# NEC Quant transfer and data contract

This is the implementation contract for a future checkout. The Mercury dime card is a UI test; it does not debit a wallet, ship an item, or grant another party access to browsing history.

## Ownership and price

A Quant is a unique asset with a serial number and a fixed checkout unit of 1 dollar. StarCoin is the fractional unit: 0.01 StarCoin covers one cent in checkout. Thus a $5.15 checkout transfers 5 Quants and 0.15 StarCoin. A 100 Quant test price transfers 100 distinct Quant serials. A checkout quote never changes ownership; only a committed NEC transaction does.

NEC chooses eligible Quants in a deterministic order: unenhanced Music Quants first, then other unenhanced Quants, then enhanced Quants only after showing the buyer which metadata will leave their control. The buyer can choose specific serials before completing a transfer. NEC must never silently disclose event history just because a low-value Quant was selected.

## Quant record in Cloudflare D1

`quants(serial PRIMARY KEY, creator_wallet_id, current_owner_wallet_id, mint_event_id UNIQUE, metadata_manifest_hash, metadata_policy_version, state, created_at, version)`

`quant_events(id PRIMARY KEY, serial, creator_wallet_id, event_type, event_time, payload_ciphertext, category, source_site, consent_state, digest)`

`transfers(id PRIMARY KEY, idempotency_key UNIQUE, buyer_wallet_id, seller_wallet_id, quote_hash, state, created_at, committed_at)`

`transfer_lines(transfer_id, serial, from_wallet_id, to_wallet_id, metadata_manifest_hash)`

`star_balances(wallet_id PRIMARY KEY, cents INTEGER, version)`

`star_entries(id, transfer_id, wallet_id, delta_cents, created_at)`

`receipts(id, transfer_id UNIQUE, buyer_wallet_id, seller_wallet_id, listing_id, amount_quants, amount_star_cents, shipping_status, ship_by, created_at)`

`outbox(id, transfer_id, event_type, delivery_state)`

Store exact activity payloads encrypted separately from the public serial index. Keep creator identity as a pseudonymous wallet ID; do not expose the original wallet's device identifiers, email, address, location trail, or recovery factors in a scanner response.

## Event capture

A site installs one Infinity integration with optional Search, Share/Collect, Wallet, and NEC Checkout modules. Each event is linked to a minted Quant serial or an active search session, with an explicit source and event type. Example event categories: search for Pink Floyd, click on a 1970s video, view a guitar listing, and buy a coffee cup. An event from another site or shop requires that site's integration and a verified event; the Quanta Phi plugin cannot infer purchases elsewhere.

The creator sees what will be collected and can turn off cross-site tracking. The seller cannot turn a Quant transfer into permission to track its creator indefinitely. Metadata snapshots are versioned; a transfer carries the manifest hash, and later events require a separate opt-in relationship.

## Checkout commit

1. The seller registers a listing, verified wallet, fulfillment policy, and ship-by estimate. The buyer sees the exact price and data-sharing summary.
2. NEC authenticates both wallets, verifies seller inventory and buyer balances, and creates a short-lived quote with chosen Quant serials and StarCoin cents.
3. The buyer authorizes purchase. In one D1 transaction, NEC checks versions and ownership, writes debit and credit entries, changes each serial's owner, inserts the receipt, and inserts outbox notifications. An idempotency key prevents duplicate charges.
4. Only after commit does the buyer see Purchased and both inboxes receive a receipt. The receipt includes seller contact, item, price, transaction ID, address provided to the seller, and a **seller-supplied** ship-by estimate. Actual shipment requires a seller status update.
5. On failure, no ownership or balance changes occur. Refund is a new auditable reverse transfer, not a file edit.

No browser, GitHub page, or caller may write D1 balances directly. The Worker checks authorization and uses prepared statements and transactions. A nightly invariant check compares serial ownership and double-entry totals. No claim of CIA enforcement is part of security.

## Scanner and ad matching

`GET /v1/quants/:serial/manifest` returns serial, owner attestation, manifest hash, categories, timestamps, and consent flags. It never returns raw events.

`POST /v1/quants/:serial/scan` requires a signed owner-scoped capability and the creator's explicit advertising permission. It returns only the allowed snapshot categories or a match result, such as `{category:"coffee mugs", matchedInventoryIds:["mug-42"], allowedChannel:"in-app", expiresAt:"..."}`. Raw search and purchase events remain encrypted and are not handed to arbitrary buyers or merchants.

Ads to the original creator require a separate creator-approved channel. A seller can propose a matching offer; the creator's AI/wallet decides whether to display it. Ownership of a Quant never grants the seller access to message the original creator or identify them. Store consent version, access audit, expiry, revocation, and retention limit with every capability.

## Integration package

Publish one script/SDK, `@infinity/phi`, exposing `search.mount`, `rewards.share`, `rewards.collect`, `wallet.mount`, and `nec.checkout`. Each site registers an origin and a server key. The browser receives only short-lived scoped tokens. The SDK sends signed events to Cloudflare and renders the corresponding buttons; a website builder can select modules without copying ledger code.

## Build order and acceptance

1. D1 migrations, Worker auth, wallet resolution, and read-only Quant manifest.
2. Mint/event linkage and creator consent interface.
3. Atomic NEC transfer with idempotent 100 Quant test in an isolated test ledger, plus StarCoin cents for fractional prices.
4. Receipt inbox API and seller fulfillment updates.
5. Scanner capability, private matching, revocation, audit, and cross-site SDK.
6. Switch the Mercury dime listing from local simulation to the test ledger only after the debit, credit, and receipt are verified from both wallets.

Acceptance: repeated checkout calls create one transfer; insufficient funds create none; a recipient sees only a consented snapshot; revoked consent blocks future scans; buyer and seller read the same committed transaction; no receipt claims shipping without a seller update.
