# NEC

Design documents: [Buy Now point of sale](POS_FLOW.md), [wallet recovery](WALLET_RECOVERY.md), and [security layers and upstream projects](SECURITY_LAYERS.md).

NEC coordinates checkout for items listed across the Infinity sites. A price such as **$5.15** is expressed as **5 Quants and 15 StarCoin hundredths (0.15 StarCoin)**; the hundredth units are the change side of the quote. A balance of 14.60 becomes 14.45 after that change payment. These are application units, not a cash payment or a dollar redemption promise.

## Current status

The wallet ledger is live in Cloudflare: ordinary Quants and Music Quant ownership are in `infinity-ledger`, while StarCoin account balances are in `starquest-ledger`. These are separate D1 databases, so a mixed-asset checkout is not atomic by default. **Do not debit a buyer or mark an item sold from a browser-only transfer sequence.**

NEC needs an authenticated, server-side checkout with a seller-owned listing, buyer confirmation, idempotency key, recorded quote, conditional debits, matching credits, and reconciliation for interrupted settlement. Music Quant selection should prefer lower musical-content scores and be confirmed on the server against current ownership. StarCoin hundredths have no selection ranking and are transferred by balance. The present StarQuest schema stores whole `star_coins` and `pending_share_credits` (0–9 share-progress units), so it cannot represent an arbitrary payment such as 0.15 StarCoin. NEC must add an authoritative integer hundredth-unit spendable balance and migrate verified balances before it can settle StarCoin change. Share-progress bookkeeping and spendable balance must remain distinct. Infinity tokens and Alien tokens are separately owned assets: their owners set asking prices, and NEC must not apply this fixed Quant/StarCoin conversion to those listings. Seller and buyer receipts carry the same transaction ID.

## Integration contract

Sites mark a real item with a listing ID, show the full quote, and provide a Buy now button. That click is the purchase authorization when delivery details are already available. For a physical item without an address, the first tap collects shipping details and the final Buy now tap authorizes payment. NEC verifies the listing and seller wallet on the server; the buyer does not enter token amounts. Arbitrary page text or scraped prices are not authorization to move tokens. A Cloudflare receipt is the only success state.

## Before enabling live payments

1. Build the listing registry and authenticated buyer checkout endpoint.
2. Add an idempotent settlement journal and recovery worker spanning the two D1 databases; reconcile every interrupted debit and credit.
3. Add server-side Music Quant ranking and ownership checks, plus ordinary Quant allocation.
4. Embed the NEC checkout widget on item listings across the sites.
5. Run authenticated two-account tests for success, insufficient balance, retries, concurrency, and interrupted settlement.

The Radio save path is separate: a device-held Music Quant does not enter cloud ownership until its StarQuest account authenticates and the sync endpoint returns that Quant ID.
