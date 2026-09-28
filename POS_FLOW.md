# NEC Buy Now point of sale flow

## Buyer experience

1. An item page shows the seller, the item, and the **full payable quote** beside **Buy now**. For a fixed $5.15 example the quote is 5 Quants plus 0.15 StarCoin. The buyer never types Quant or StarCoin amounts and NEC chooses eligible lower-content Music Quants automatically.
2. If the item is digital or the buyer already has a saved delivery choice, tapping **Buy now** is the purchase authorization. The site submits a single purchase intent with a stable idempotency key. The button shows **Processing** and cannot create a second charge. Only a committed Cloudflare receipt changes it to **Purchased**.
3. If a physical item needs a shipping address and none is saved, the first tap opens a short delivery form. The item and total stay visible. **Buy now** on that form is the purchase authorization; NEC does not charge before a usable address and final buyer action. Saved addresses are optional.
4. A receipt shows the item, seller, exact assets debited, transfer ID, delivery status, and a way to report a problem. The seller receives a corresponding sale record and the shipping details needed to fulfill that order. Fulfillment is a separate obligation after payment; a transfer receipt does not prove shipment or delivery.

## Privacy and shipping

The public token ledger contains a transaction ID and asset movement, **not** the buyer's street address. Shipping details are visible only to the seller fulfilling the specific order and authorized support, with access logging and a retention rule. The buyer may supply a PO box or business recipient name if the seller and carrier accept it; those choices do not guarantee anonymity. Do not infer a residential address from location or click history.

## Server behavior

The item page provides only a listing ID and purchase intent. NEC loads the current seller-owned listing and locked quote from the server, verifies the buyer device/account, checks inventory, available assets, ownership, recipient, shipping requirement, and idempotency, then settles both ledger legs. It must recheck the listing price and availability at purchase time. If either changed, display the new details and require another Buy action; never silently charge a different amount.

For a mixed Quant/StarCoin purchase, **Purchased** means both legs are committed and reconciliation has verified them. If settlement is interrupted, show **Processing** or **Needs review**, keep the same idempotency key, and do not release shipment or double charge. A seller cannot mark a listing sold merely by receiving a browser callback.

## Current status

This is the POS contract, not a live checkout. NEC has price selection code but no listing registry, seller onboarding, shipping vault, mixed-ledger settlement, or authenticated two-account end-to-end test. Do not display an active Buy button until those services are working.
