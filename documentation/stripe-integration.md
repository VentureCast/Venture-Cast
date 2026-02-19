# VentureCast Stripe Integration Guide

## Overview

This document describes the complete Stripe Connect + Treasury integration for VentureCast, enabling users to deposit funds, trade creator stocks, and withdraw earnings.

## Architecture Components

### Stripe Products Used

1. **Stripe Connect (Custom Accounts)** - Each user gets a Custom connected account
2. **Stripe Treasury** - Financial accounts for holding and moving funds
3. **Stripe Payments** - PaymentIntents for deposits
4. **Stripe Hosted Onboarding** - KYC/AML verification

### Data Flow

```
User → Mobile App → Express Backend → Stripe API
                                   ↓
                           MongoDB (user data)
```

---

## Environment Setup

### Backend Environment Variables

Create/update `VentureCast_Backend-main/.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/venture-cast-backend

# Session
SESSION_SECRET=your-secure-session-secret-here

# Stripe Keys (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# OAuth (existing)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
APPLE_CLIENT_ID=your_apple_client_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
```

### Frontend Configuration

Update `VentureCast_Frontend-main/StripeProvider.tsx`:

```typescript
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_PUBLISHABLE_KEY';
```

---

## API Endpoints

### Account Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/stripe/create-account` | Create Stripe Connect Custom account |
| POST | `/stripe/create-financial-account` | Create Treasury Financial Account |
| POST | `/stripe/onboarding-link` | Get hosted onboarding URL |
| GET | `/stripe/account-status` | Get account/verification status |

### Payment Methods

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/stripe/create-customer` | Create Stripe Customer |
| POST | `/stripe/setup-intent` | Create SetupIntent for adding cards |
| GET | `/stripe/payment-methods` | List user's payment methods |
| POST | `/stripe/set-default-payment-method` | Set default payment method |
| DELETE | `/stripe/payment-method/:id` | Remove payment method |

### Deposits

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/stripe/deposit` | Create PaymentIntent for deposit |
| POST | `/stripe/confirm-deposit` | Confirm deposit after payment |

### Withdrawals

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/stripe/add-bank-account` | Add external bank account |
| GET | `/stripe/bank-accounts` | List user's bank accounts |
| POST | `/stripe/withdraw` | Create outbound transfer |

### Balance & Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stripe/balance` | Get Treasury balance |
| POST | `/stripe/transfer` | Internal transfer (for trading) |
| GET | `/stripe/transactions` | Get transaction history |

### Webhook

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhook` | Stripe webhook handler |

---

## Webhook Events

Configure these events in the Stripe Dashboard:

```
account.updated
account.application.authorized
account.application.deauthorized
payment_intent.succeeded
payment_intent.payment_failed
payment_intent.canceled
payment_method.attached
payment_method.detached
treasury.financial_account.features_status_updated
treasury.received_credit.created
treasury.received_debit.created
treasury.outbound_transfer.created
treasury.outbound_transfer.posted
treasury.outbound_transfer.failed
treasury.outbound_transfer.returned
payout.created
payout.paid
payout.failed
capability.updated
```

---

## Security & Compliance

### PCI Compliance

VentureCast maintains PCI compliance by:

1. **Never storing card numbers** - All card data goes directly to Stripe via their SDK
2. **Using Stripe Elements/PaymentSheet** - Card UI components are provided by Stripe
3. **Server never sees raw card data** - Only tokenized PaymentMethod IDs are stored

### Webhook Security

```javascript
// Webhooks are verified using Stripe's signature
const event = stripe.webhooks.constructEvent(
  req.body,
  req.headers['stripe-signature'],
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### Secret Management

1. **Never commit API keys** - Use environment variables
2. **Use different keys per environment** - Test keys for development, live for production
3. **Rotate keys periodically** - Especially if suspected compromise
4. **Restrict key permissions** - Use restricted keys in production

### PII Handling

1. **Minimal storage** - Only store IDs (stripeAccountId, not SSN)
2. **Stripe handles KYC data** - Personal documents go directly to Stripe
3. **Bank account numbers** - Only last 4 digits stored locally for display
4. **HTTPS only** - All API calls use TLS encryption

---

## User Onboarding Flow

```
1. User Signs Up (Supabase + MongoDB)
        ↓
2. Create Stripe Connect Account
   POST /stripe/create-account
        ↓
3. Create Stripe Customer (for payment methods)
   POST /stripe/create-customer
        ↓
4. Create Treasury Financial Account
   POST /stripe/create-financial-account
        ↓
5. Get Onboarding Link
   POST /stripe/onboarding-link
        ↓
6. User Completes KYC in WebView
   (Stripe Hosted Onboarding)
        ↓
7. Webhook: account.updated
   → Update user status
        ↓
8. User Ready to Trade!
```

---

## Deposit Flow

```
1. User Enters Amount in App
        ↓
2. Create PaymentIntent
   POST /stripe/deposit
   → Returns clientSecret
        ↓
3. Present PaymentSheet
   (Stripe SDK handles card UI)
        ↓
4. User Confirms Payment
        ↓
5. PaymentIntent Succeeds
   → Webhook: payment_intent.succeeded
        ↓
6. Funds Transfer to Connected Account
   (Automatic via transfer_data)
        ↓
7. Confirm Deposit
   POST /stripe/confirm-deposit
        ↓
8. Update User Balance
```

---

## Withdrawal Flow

```
1. User Enters Amount in App
        ↓
2. Validate Balance
   GET /stripe/balance
        ↓
3. Create Outbound Transfer
   POST /stripe/withdraw
        ↓
4. Treasury Processes Transfer
        ↓
5. Webhook: treasury.outbound_transfer.posted
   → Update transaction status
        ↓
6. Funds Arrive in Bank (1-3 business days)
```

---

## Testing

### Test Cards

Use Stripe's test card numbers:

| Card Number | Scenario |
|-------------|----------|
| 4242424242424242 | Successful payment |
| 4000000000000002 | Declined |
| 4000002500003155 | Requires authentication |
| 4000000000009995 | Insufficient funds |

### Test Bank Accounts

| Routing | Account | Scenario |
|---------|---------|----------|
| 110000000 | 000123456789 | Successful verification |
| 110000000 | 000111111116 | Verification fails |

### Testing Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:3001/webhook
```

---

## Troubleshooting

### Common Issues

1. **"User must have a Stripe Connect account first"**
   - User hasn't completed initial account creation
   - Call `POST /stripe/create-account` first

2. **"No financial account"**
   - User hasn't completed KYC onboarding
   - Call `POST /stripe/create-financial-account` after onboarding

3. **"Webhook signature verification failed"**
   - Check `STRIPE_WEBHOOK_SECRET` is correct
   - Ensure raw body parser is used for webhook route

4. **"Insufficient funds"**
   - User's Treasury balance is too low
   - Check `GET /stripe/balance`

### Debug Commands

```bash
# Check webhook events
stripe events list --limit 10

# Retrieve account details
stripe accounts retrieve acct_xxxxx

# Check financial account balance
stripe treasury financial_accounts retrieve fa_xxxxx --stripe-account acct_xxxxx
```

---

## Production Checklist

- [ ] Switch to live Stripe API keys
- [ ] Configure live webhook endpoint
- [ ] Enable webhook signature verification
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure rate limiting
- [ ] Enable HTTPS everywhere
- [ ] Review Stripe Dashboard permissions
- [ ] Complete Stripe Connect platform verification
- [ ] Test complete flows with live keys
- [ ] Set up alerting for failed payments
