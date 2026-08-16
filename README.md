# LOWLAW

**Your legal life, in one place.** Record what happened. Own your case. Choose who helps next.
Before a case. During a case. After a case.

Live: **https://lowlaws.com**

---

## What this repository is

A working prototype of a client-owned operating system for a legal matter.

- `index.html` — the product surface. 104 screens across three modes
  (Individual / Business, Legal Provider, Expert), a command palette over every screen,
  and a mobile shell with bottom tabs.
- `seal.html` — **this one is real.** Seal a file or a piece of text.
- `verify.html` — **this one is real.** Verify any receipt, with no account.
- `api/seal.mjs` — the serverless function behind both.

Everything else on the site is an interactive prototype and is labelled as such.
Every number, name and document shown is sample data.

## How the seal works

1. Your **device** computes a SHA-256 hash of the file. The file never leaves the browser.
2. The **server** signs `{hash, timestamp, schema}` with an Ed25519 key. It never sees the content.
3. The receipt is **self-contained** — verification needs no database lookup, and works
   even if LOWLAW no longer exists.

A seal proves that this exact content existed at this exact moment and has not changed since.
**It says nothing about whether the content is true.** A notary works the same way, and any
platform that blurs that line is worthless.

## Running it

Static files at the repository root, one serverless function under `api/`.
Deployed on Vercel; a push to `main` ships it.

```
POST /api/seal    { sha256, name, bytes, kind }          -> { id, receipt, token }
POST /api/seal    { action: "verify", token, sha256? }    -> { verified, payload, means }
```

### Signing key

`api/seal.mjs` ships with a **demo key committed in the clear** so the prototype works out of the box.
It is not a secret and receipts signed with it carry no weight.

Before any real use:

1. Set `SEAL_PRIVATE_KEY` and `SEAL_PUBLIC_KEY` as environment variables, or
2. Move signing to an AWS KMS asymmetric key so the private key never exists in application memory.

Rotating the key invalidates previously issued receipts. That is intentional for a prototype
and unacceptable in production — which is the reason for KMS.

## Design commitments

- Any service that could see user content is either on the device or not in the stack.
- The layer that explains law and the layer that describes user material stay separate in code.
  **LOWLAW never draws the conclusion.**
- Flat subscriptions only. Never a percentage of legal fees. Never a per-case referral fee.
- Verification scales with what you can do to other people — never with who you are.
- Inactivity can start a verification process. It can never release a key.
