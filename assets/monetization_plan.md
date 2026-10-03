# 💰 CamSound Monetization & Premium Features — Implementation Plan

## Current State Assessment

After analyzing the full codebase, here's what **already exists** and what **needs to be built/fixed**:

### ✅ Already Built
| Component | Status | File |
|-----------|--------|------|
| Subscription plans page (UI) | Working | [Subscription.tsx](file:///d:/camsound/camsound-frontend/src/pages/Subscription.tsx) |
| MoMo payment simulation modal | Working | [MoMoPaymentModal.tsx](file:///d:/camsound/camsound-frontend/src/components/MoMoPaymentModal.tsx) |
| Backend MoMo simulation service | Working | [momoService.ts](file:///d:/camsound/camsound-backend/src/services/momoService.ts) |
| MoMo routes (initiate/verify/disburse/webhook) | Working | [momo.ts](file:///d:/camsound/camsound-backend/src/routes/momo.ts) |
| Plan model + CRUD | Working | [Plan.ts](file:///d:/camsound/camsound-backend/src/models/Plan.ts) |
| Subscription model + CRUD | Working | [Subscription.ts](file:///d:/camsound/camsound-backend/src/models/Subscription.ts) |
| Payment model + CRUD | Working | [Payment.ts](file:///d:/camsound/camsound-backend/src/models/Payment.ts) |
| Withdrawal model | Working | [Withdrawal.ts](file:///d:/camsound/camsound-backend/src/models/Withdrawal.ts) |
| Frontend API services for all above | Working | [api.ts](file:///d:/camsound/camsound-frontend/src/services/api.ts) |

### 🔴 Critical Bugs Found
| Bug | Location | Impact |
|-----|----------|--------|
| User model `subscriptionStatus` enum is `'free' \| 'premium' \| 'artist'` but frontend and MoMo verify route reference `'vip'` | [User.ts L33](file:///d:/camsound/camsound-backend/src/models/User.ts#L33) | VIP subscriptions silently fail to save |
| No subscription expiry enforcement | Backend-wide | Users stay premium forever after one payment |

---

## 🏗️ Implementation Plan (7 Phases)

> **Goal**: Build everything production-ready with a simulated payment layer that can be swapped for real MoMo Pay in one step.

---

### Phase 1: Fix Data Model & Payment Gateway Abstraction Layer
> *The foundation — clean up bugs and create a proper gateway interface*

#### 1.1 Fix User Model — Add 'vip' to subscriptionStatus enum
**File**: [User.ts](file:///d:/camsound/camsound-backend/src/models/User.ts)
```diff
- subscriptionStatus: { type: String, enum: ['free', 'premium', 'artist'], default: 'free' },
+ subscriptionStatus: { type: String, enum: ['free', 'premium', 'vip', 'artist'], default: 'free' },
```

#### 1.2 Create Payment Gateway Abstraction (`PaymentGateway` interface)
**New file**: `camsound-backend/src/services/paymentGateway.ts`

This is the **key architectural piece** — an interface that the simulated gateway implements now, and real MoMo gateways (Campay, Fapshi, etc.) will implement later.

```typescript
// Interface that ALL payment gateways must implement
export interface PaymentGateway {
  name: string;
  initiate(params: InitiateParams): Promise<InitiateResult>;
  verify(transactionId: string): Promise<VerifyResult>;
  disburse(params: DisburseParams): Promise<DisburseResult>;
  validateWebhook(headers: any, body: any): boolean;
}

export interface InitiateParams {
  amount: number;
  phone: string;
  currency: string;
  reason: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface InitiateResult {
  transactionId: string;
  status: 'pending' | 'failed';
  checkoutUrl?: string;
  ussdCode?: string;
  message: string;
}

export interface VerifyResult {
  transactionId: string;
  success: boolean;
  providerStatus: string;
  financialTransactionId?: string;
  amount?: number;
  message: string;
  timestamp: string;
}

export interface DisburseParams {
  amount: number;
  phone: string;
  reason: string;
  metadata?: Record<string, any>;
}

export interface DisburseResult {
  transactionId: string;
  success: boolean;
  amount: number;
  fee: number;
  netAmount: number;
  recipientPhone: string;
  status: string;
  message: string;
  timestamp: string;
}
```

#### 1.3 Refactor `momoService.ts` into `SimulatedGateway` implementing the interface
**File**: Rename/refactor [momoService.ts](file:///d:/camsound/camsound-backend/src/services/momoService.ts) → `simulatedGateway.ts`

#### 1.4 Create Gateway Factory
**New file**: `camsound-backend/src/services/gatewayFactory.ts`
```typescript
// Reads from env to decide which gateway to use
// PAYMENT_GATEWAY=simulated | campay | fapshi | nkwapay | chokopay
export function getPaymentGateway(): PaymentGateway { ... }
```

---

### Phase 2: Subscription Lifecycle (Backend)
> *Expiry, renewal, downgrade, and enforcement*

#### 2.1 Add Subscription Expiry Checker (Cron/Middleware)
- **New file**: `camsound-backend/src/services/subscriptionService.ts`
- A function that runs on app startup and periodically:
  - Finds all Subscriptions where `endDate < now` and `status === 'active'`
  - Sets their `status → 'expired'`
  - Sets User's `subscriptionStatus → 'free'`
- Also add a middleware that checks subscription validity on protected routes

#### 2.2 Enhance Subscription Model
**File**: [Subscription.ts](file:///d:/camsound/camsound-backend/src/models/Subscription.ts)
```diff
  export interface ISubscription extends Document {
      userId: Types.ObjectId;
+     planId: Types.ObjectId;
      planName: string;
      amount: number;
+     currency: string;
      status: 'active' | 'expired' | 'cancelled';
      startDate: Date;
      endDate: Date;
+     autoRenew: boolean;
+     paymentTransactionId?: string;
+     cancelledAt?: Date;
+     cancelReason?: string;
  }
```

#### 2.3 Enhance Payment Model
**File**: [Payment.ts](file:///d:/camsound/camsound-backend/src/models/Payment.ts)
```diff
  export interface IPayment extends Document {
      userId: Types.ObjectId;
      subscriptionId?: Types.ObjectId;
      amount: number;
      currency: string;
      paymentMethod?: string;
      transactionId?: string;
+     gatewayTransactionId?: string;
+     phone?: string;
+     purpose: 'subscription' | 'tip' | 'withdrawal' | 'other';
+     metadata?: Record<string, any>;
      status: 'pending' | 'completed' | 'failed' | 'refunded';
  }
```

#### 2.4 Update MoMo Routes to use Gateway Abstraction
**File**: [momo.ts](file:///d:/camsound/camsound-backend/src/routes/momo.ts)
- Replace direct `momoService` calls with `getPaymentGateway()` calls
- Add proper error handling for gateway failures
- Calculate subscription `endDate` based on plan period (monthly vs annual)

---

### Phase 3: Premium Content Gating (Backend + Frontend)
> *Make premium subscriptions actually mean something*

#### 3.1 Song Model — Add Premium Flag
**File**: [Song.ts](file:///d:/camsound/camsound-backend/src/models/Song.ts) (already exists)
```diff
+ isPremium: { type: Boolean, default: false },
+ premiumTier: { type: String, enum: ['free', 'premium', 'vip'], default: 'free' },
```

#### 3.2 Premium Gating Middleware
**New file**: `camsound-backend/src/middleware/premiumGate.ts`
- Check user's `subscriptionStatus` against song's `premiumTier`
- Free users: allow 30-second preview of premium songs, then block
- Premium users: full access to premium songs
- VIP users: full access to everything + no ads

#### 3.3 Frontend Premium Content Indicators
- Add 👑 crown icon on premium songs in song cards
- Show "Upgrade to listen" overlay for free users
- 30-second preview with upgrade prompt
- Ad-free badge for premium/VIP users

#### 3.4 Artist Upload — Toggle Premium Content
- Add "Mark as Premium" toggle in the artist upload form
- Artists can mark individual songs as premium-only

---

### Phase 4: Payment History & User Subscription Management (Frontend)
> *Let users see their transaction history and manage subscriptions*

#### 4.1 Payment History Component
**New file**: `camsound-frontend/src/components/FanPaymentHistory.tsx`
- List all payments with status, date, amount
- Filter by type (subscription, tip)
- Download receipt (reuse existing receipt design from MoMoPaymentModal)

#### 4.2 Active Subscription Card
**New file**: `camsound-frontend/src/components/FanSubscriptionCard.tsx`
- Show current plan, start/end dates, days remaining
- Progress bar showing subscription timeline
- "Renew" and "Cancel" buttons
- Plan comparison (current vs upgrade)

#### 4.3 Integrate into Fan Dashboard/Settings
- Add "My Subscription" section in [FanSettings.tsx](file:///d:/camsound/camsound-frontend/src/components/FanSettings.tsx)
- Add "Payment History" tab in Fan Dashboard

---

### Phase 5: Admin Monetization Dashboard
> *Give admins full visibility into revenue*

#### 5.1 Admin Revenue Overview
In [AdminDashboard.tsx](file:///d:/camsound/camsound-frontend/src/pages/AdminDashboard.tsx), add:
- Total revenue (daily/weekly/monthly/all-time)
- Active subscriptions count by plan
- Revenue breakdown chart (subscriptions vs tips)
- Recent transactions table
- Failed payment alerts

#### 5.2 Admin Subscription Management
- View all active/expired/cancelled subscriptions
- Manually activate/extend/cancel subscriptions
- Gift premium access to users

#### 5.3 Backend Stats Endpoints
- `GET /api/stats/revenue` — aggregate revenue data
- `GET /api/stats/subscriptions` — subscription analytics

---

### Phase 6: Artist Tipping & Revenue
> *MoMo tips from fans to artists + artist earnings dashboard*

#### 6.1 Tip Flow (Already Partially Built)
- The MoMo modal already supports `mode='tip'` — verify it creates proper records
- Add tip history to artist earnings dashboard
- Create a tip leaderboard on artist profile

#### 6.2 Artist Earnings Dashboard Enhancements
- Show breakdown: streaming royalties vs tips vs ad revenue
- Withdrawal history with MoMo transaction receipts
- Pending vs completed withdrawals

---

### Phase 7: Polish & Production Hardening
> *Security, validation, edge cases*

#### 7.1 Security
- Rate limiting on payment endpoints
- Idempotency keys for payment initiation (prevent double charges)
- Webhook signature validation placeholder (for real gateway)
- Transaction amount validation (min/max)

#### 7.2 Edge Cases
- Handle concurrent subscription creation
- Grace period after expiry (e.g., 3 days)
- Downgrade flow (premium → free: what happens to saved premium songs?)
- Network failure recovery (payment initiated but verification lost)

#### 7.3 Notification Integration
- Payment confirmation notification
- Subscription expiry warning (7 days, 3 days, 1 day before)
- Subscription expired notification
- Tip received notification (for artists)

---

## 🔮 Future: Real MoMo Pay Integration Guide

> [!IMPORTANT]
> **When you're ready to go live**, you only need to implement ONE new file — a gateway class that implements the `PaymentGateway` interface — and update ONE env variable.

### Step-by-Step for Real Integration

#### 1. Choose a Gateway Provider

| Provider | Website | API Style | Fees | Best For |
|----------|---------|-----------|------|----------|
| **Campay** | campay.net | REST API | ~1-2% | Most popular in Cameroon |
| **Fapshi** | fapshi.com | REST API | ~1.5% | Good docs, easy setup |
| **Nkwa Pay** | nkwapay.com | REST API | ~1-2% | Multi-operator support |
| **ChokoPay** | chokopay.com | REST API | Varies | Newer, modern API |

#### 2. Create a Real Gateway Implementation

Example for Campay:
```
New file: camsound-backend/src/services/campayGateway.ts
```
```typescript
import { PaymentGateway, InitiateParams, InitiateResult, ... } from './paymentGateway';

export class CampayGateway implements PaymentGateway {
  name = 'Campay';
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CAMPAY_API_KEY!;
    this.apiSecret = process.env.CAMPAY_API_SECRET!;
    this.baseUrl = process.env.CAMPAY_ENV === 'production'
      ? 'https://api.campay.net/v2'
      : 'https://demo.campay.net/api/v2';
  }

  async initiate(params: InitiateParams): Promise<InitiateResult> {
    // Call Campay's POST /collect endpoint
    // Map their response to our InitiateResult interface
  }

  async verify(transactionId: string): Promise<VerifyResult> {
    // Call Campay's GET /transaction/{reference}
    // Map their response to our VerifyResult interface
  }

  async disburse(params: DisburseParams): Promise<DisburseResult> {
    // Call Campay's POST /disburse endpoint
  }

  validateWebhook(headers: any, body: any): boolean {
    // Verify Campay's webhook signature
  }
}
```

#### 3. Register in Gateway Factory
```typescript
// gatewayFactory.ts
import { CampayGateway } from './campayGateway';

export function getPaymentGateway(): PaymentGateway {
  switch (process.env.PAYMENT_GATEWAY) {
    case 'campay': return new CampayGateway();
    case 'fapshi': return new FapshiGateway();
    // ... more gateways
    default: return new SimulatedGateway(); // Current behavior
  }
}
```

#### 4. Update Environment Variables
```env
PAYMENT_GATEWAY=campay
CAMPAY_API_KEY=your_api_key
CAMPAY_API_SECRET=your_api_secret
CAMPAY_ENV=sandbox  # or 'production'
PAYMENT_CALLBACK_URL=https://yourdomain.com/api/momo/webhook
```

#### 5. Requirements for Going Live with Any Provider
- [ ] Register a business account with the provider
- [ ] Get API credentials (sandbox first, then production)
- [ ] Set up a public callback/webhook URL (requires deployed backend)
- [ ] Implement webhook signature verification
- [ ] Test full flow in sandbox mode
- [ ] Apply for production access (may require KYC)
- [ ] Switch `PAYMENT_GATEWAY` env var and deploy

> [!NOTE]
> The entire architecture is built so that **zero frontend changes** are needed when switching from simulated to real payment. The frontend talks to your backend, your backend talks to the gateway through the abstraction layer.

---

## 📋 Execution Order Summary

| Phase | What | Priority | Effort |
|-------|------|----------|--------|
| **Phase 1** | Fix bugs + Gateway abstraction | 🔴 Critical | ~2 hours |
| **Phase 2** | Subscription lifecycle | 🔴 Critical | ~3 hours |
| **Phase 3** | Premium content gating | 🟡 High | ~3 hours |
| **Phase 4** | User payment history UI | 🟡 High | ~2 hours |
| **Phase 5** | Admin revenue dashboard | 🟢 Medium | ~2 hours |
| **Phase 6** | Artist tipping polish | 🟢 Medium | ~2 hours |
| **Phase 7** | Security & edge cases | 🟡 High | ~2 hours |

**Total estimated effort: ~16 hours of implementation**

---

> [!TIP]
> Want me to start executing? I'll begin with **Phase 1** (fix the `'vip'` bug + create the gateway abstraction layer), then proceed phase by phase. Say **"Proceed"** to start!
