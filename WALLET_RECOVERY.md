# Wallet identity and recovery

## Current implementation

Infinity sites under `www-infinity4.github.io` share one browser origin. Radio can restore a `starquest_ledger_device_v1:<account>` token already stored in that browser or create a device wallet automatically. The token is a random bearer secret; Cloudflare stores its SHA-256 hash in `starquest-ledger.account_devices` and maps it to `accounts.id`. Quanta Phi, Music Quants, the unified wallet, and NEC must resolve that same account ID before showing ownership or committing a transfer.

This recognizes the browser profile, not a SIM, household, person, or physical device. Clearing site data can remove the secret. A different browser or phone does not inherit it automatically. No current flow has proved that an old wallet can be recovered after losing every enrolled device.

## Recovery design

1. While the device wallet is working, offer optional **Protect this wallet**. Enroll a passkey through WebAuthn and verify an email address. Issue a one-time recovery code for the user to save outside the browser. The ordinary wallet never requires a paid sign-in or a password.
2. On a second phone or computer, **Add this device** uses a passkey assertion to the same account. The server creates a new device credential bound to the existing `accounts.id`; it never merges accounts because of a shared IP address or household.
3. If the first device is gone, recovery starts from the previously verified email and a saved recovery code (or another still-enrolled passkey). A one-time email link alone must not silently transfer asset ownership. Notify the old email and any active devices about device addition/recovery; rate-limit and journal attempts. In a recovery hold, block outgoing transfers until the new authenticator is confirmed.
4. Store passkey public credentials and hashed recovery codes server-side. The private key remains with the authenticator. Bind challenge, origin, account, and expiry; consume recovery codes once. Device tokens can be revoked from a wallet security page.
5. A successfully recovered account fetches the same Cloudflare balances and ownership rows. NEC may act only after this server-authenticated account resolution and a buyer-confirmed listing quote.

## Signals that cannot establish ownership

- A website cannot read a SIM identifier, IMEI, or stable computer hardware serial. Do not attempt device fingerprinting as a substitute for a credential.
- Geolocation requires browser permission and can be wrong or spoofed; travel from point A to point B is not a reliable proof. If the user opts in, coarse location can flag an unusual recovery attempt for review, not approve it.
- IP address and household proximity cannot merge wallets. VPNs, shared networks, travel, and family devices make that unsafe.
- Clicks, searches, and music history are product data, not authentication factors. Do not demand them for recovery or use them to silently identify a person.

## Migration and release gates

Keep the current device-token flow working. Add account recovery tables and endpoints without changing existing owner IDs. Enroll and recover using a test account with two devices, then verify both devices read the same D1 Music Quant and StarCoin state. Test stolen email, reused recovery code, wrong origin, lost device, and transfer hold. Do not enable NEC checkout until account binding and mixed-asset settlement have both passed authenticated tests.
