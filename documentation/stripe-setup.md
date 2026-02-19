# Stripe Setup Guide for VentureCast

This guide covers how to obtain and configure the required Stripe API keys for VentureCast.

---

## Required Keys

| Key | Location | Purpose |
|-----|----------|---------|
| `STRIPE_SECRET_KEY` | Backend `.env` | Authenticates all server-side Stripe API calls |
| `STRIPE_PUBLISHABLE_KEY` | Frontend `StripeProvider.tsx` | Initializes Stripe SDK in the app |
| `STRIPE_WEBHOOK_SECRET` | Backend `.env` | Verifies webhook signatures |

---

## Step 1: Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete the account verification process
3. Access the [Stripe Dashboard](https://dashboard.stripe.com)

---

## Step 2: Get API Keys

### Secret Key & Publishable Key

1. Navigate to [Dashboard → Developers → API Keys](https://dashboard.stripe.com/apikeys)
2. Copy the keys:
   - **Publishable key**: `pk_test_...` (for frontend)
   - **Secret key**: `sk_test_...` (for backend)

> **Note**: Use `test` keys during development. Switch to `live` keys for production.

### Webhook Secret

#### For Local Development

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/webhook
```

The CLI will output a webhook signing secret like:
```
Ready! Your webhook signing secret is whsec_abc123...
```

Copy this `whsec_...` value.

#### For Production

1. Go to [Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter your production URL: `https://your-domain.com/webhook`
4. Select events to listen for (see list below)
5. Click **Add endpoint**
6. Copy the **Signing secret** from the endpoint details

---

## Step 3: Configure Keys

### Backend Configuration

Create or update `VentureCast_Backend-main/.env`:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Other existing variables...
PORT=3001
MONGODB_URI=mongodb://localhost:27017/venture-cast-backend
SESSION_SECRET=your-session-secret
```

### Frontend Configuration

Update `VentureCast_Frontend-main/StripeProvider.tsx` (line 14):

```typescript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_publishable_key_here';
```

---

## Step 4: Enable Stripe Connect

VentureCast uses Stripe Connect Custom Accounts for user onboarding.

1. Go to [Dashboard → Connect → Settings](https://dashboard.stripe.com/settings/connect)
2. Enable Connect for your platform
3. Configure your platform profile:
   - Business name
   - Support email
   - Branding (logo, colors)
4. Set up OAuth settings if needed

---

## Step 5: Apply for Stripe Treasury (Required)

VentureCast uses Stripe Treasury for holding user funds. **Treasury requires approval from Stripe.**

1. Go to [Dashboard → Treasury](https://dashboard.stripe.com/treasury)
2. Click **Get started** or **Apply**
3. Complete the application:
   - Describe your use case (creator stock trading platform)
   - Explain fund flows (deposits → trading → withdrawals)
   - Provide business documentation
4. Wait for approval (typically 2-5 business days)

> **Important**: Until Treasury is approved, financial account creation and deposit/withdraw flows will fail. You can still test Connect account creation and KYC onboarding without Treasury.

---

## Step 6: Configure Webhook Events

Add these webhook events in the Stripe Dashboard:

### Account Events
- `account.updated`
- `account.application.authorized`
- `account.application.deauthorized`
- `capability.updated`

### Payment Events
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `payment_method.attached`
- `payment_method.detached`

### Treasury Events
- `treasury.financial_account.features_status_updated`
- `treasury.received_credit.created`
- `treasury.received_debit.created`
- `treasury.outbound_transfer.created`
- `treasury.outbound_transfer.posted`
- `treasury.outbound_transfer.failed`
- `treasury.outbound_transfer.returned`

### Payout Events
- `payout.created`
- `payout.paid`
- `payout.failed`

---

## Testing the Integration

### 1. Start the Backend

```bash
cd VentureCast_Backend-main
npm install
npm run dev
```

### 2. Start Webhook Forwarding

```bash
stripe listen --forward-to localhost:3001/webhook
```

### 3. Start the App

```bash
cd VentureCast_Frontend-main
yarn install
cd ios && pod install && cd ..
yarn ios
```

### 4. Test Cards

Use these test card numbers:

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Declined |
| 4000 0025 0000 3155 | Requires authentication |
| 4000 0000 0000 9995 | Insufficient funds |

**Expiry**: Any future date
**CVC**: Any 3 digits
**ZIP**: Any 5 digits

### 5. Test Bank Accounts

| Routing | Account | Scenario |
|---------|---------|----------|
| 110000000 | 000123456789 | Successful verification |
| 110000000 | 000111111116 | Verification fails |

---

## Production Checklist

Before going live:

- [ ] Switch from `test` to `live` API keys
- [ ] Update webhook endpoint to production URL
- [ ] Verify webhook signature verification is enabled
- [ ] Complete Stripe Connect platform verification
- [ ] Ensure Treasury is approved and enabled
- [ ] Test complete flows with live keys (small amounts)
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure rate limiting on API endpoints
- [ ] Enable HTTPS on all endpoints
- [ ] Review Stripe Dashboard user permissions
- [ ] Set up alerting for failed payments

---

## File Locations Reference

| File | Purpose |
|------|---------|
| `VentureCast_Backend-main/.env` | Backend environment variables |
| `VentureCast_Backend-main/routes/stripe.js` | Stripe API routes |
| `VentureCast_Backend-main/routes/webhook.js` | Webhook handler |
| `VentureCast_Frontend-main/StripeProvider.tsx` | Frontend Stripe context |
| `VentureCast_Frontend-main/services/api.ts` | API client |
| `documentation/stripe-integration.md` | Full integration documentation |

---

## Troubleshooting

### "Invalid API Key"
- Verify the key is copied correctly (no extra spaces)
- Check you're using the right key type (test vs live)
- Ensure the `.env` file is being loaded

### "Webhook signature verification failed"
- Verify `STRIPE_WEBHOOK_SECRET` matches the CLI output or Dashboard
- Ensure the webhook route uses raw body parser (not JSON)
- Check the webhook URL is correct

### "Treasury not enabled"
- Apply for Treasury access in the Stripe Dashboard
- Wait for Stripe approval before testing Treasury features

### "Connect account creation failed"
- Verify Connect is enabled in your Dashboard
- Check your platform settings are complete
- Ensure you're using Custom accounts (not Express or Standard)
