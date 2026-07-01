# Supabase Auth email templates (EHC-branded)

These three emails are sent by **Supabase Auth itself**, not the NestJS backend.
Paste the HTML into the Supabase dashboard and set the expiry windows there.

## Where to paste

Supabase dashboard → **Authentication → Email Templates**:

| File | Supabase template | Notes |
|---|---|---|
| `confirm-signup.html` | **Confirm signup** | New-account email verification |
| `reset-password.html` | **Reset Password** | Forgot-password link |
| `change-email.html` | **Change Email Address** | Sent to confirm the new address |

## Expiry windows

Supabase dashboard → **Authentication → Providers → Email**:

- **Confirmation / signup OTP expiry** → `86400` seconds (24 hours)
- **Recovery (reset) OTP expiry** → `3600` seconds (1 hour)

## Secure email change (both addresses)

To require confirmation on **both** the old and new address before an email change
applies, enable **"Secure email change"** under Authentication → Providers → Email.
Supabase then sends a confirmation to each address.

## Template variables used

These are Supabase's Go-template variables — leave them exactly as written:

- `{{ .ConfirmationURL }}` — the action link (all three)
- `{{ .Email }}` — current email (change-email)
- `{{ .NewEmail }}` — requested new email (change-email)

## Custom SMTP (recommended for deliverability)

By default Supabase sends from its shared address (rate-limited, weaker
deliverability). Point Supabase at the same provider the app uses
(**Authentication → Providers → Email → SMTP Settings**) so these auth emails
send from your domain like the rest of EHC's mail.
