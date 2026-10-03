/**
 * Payment Gateway Abstraction Layer
 * 
 * All payment gateways (simulated, Campay, Fapshi, Nkwa Pay, ChokoPay)
 * must implement this interface. This ensures the rest of the application
 * is completely agnostic to which payment provider is being used.
 * 
 * To switch from simulated to real payments:
 * 1. Create a new class implementing PaymentGateway
 * 2. Register it in gatewayFactory.ts
 * 3. Set PAYMENT_GATEWAY env var to its name
 */

// ── Request/Response Types ──

export interface InitiateParams {
    amount: number;
    phone: string;
    currency: string;
    reason: string;
    callbackUrl?: string;
    externalReference?: string;
    metadata?: Record<string, any>;
}

export interface InitiateResult {
    transactionId: string;
    status: 'pending' | 'failed';
    checkoutUrl?: string;
    ussdCode?: string;
    message: string;
    rawResponse?: any;
}

export interface VerifyResult {
    transactionId: string;
    success: boolean;
    providerStatus: string;
    financialTransactionId?: string;
    amount?: number;
    fee?: number;
    currency?: string;
    phone?: string;
    message: string;
    timestamp: string;
    rawResponse?: any;
}

export interface DisburseParams {
    amount: number;
    phone: string;
    reason: string;
    externalReference?: string;
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
    rawResponse?: any;
}

// ── Gateway Interface ──

export interface PaymentGateway {
    /** Human-readable name of the gateway (e.g., "MTN MoMo Simulated", "Campay") */
    name: string;

    /** Whether this is a simulated/sandbox gateway */
    isSimulated: boolean;

    /**
     * Initiate a payment collection (charge user's MoMo wallet).
     * Returns a pending transaction that the user must authorize.
     */
    initiate(params: InitiateParams): Promise<InitiateResult>;

    /**
     * Verify the status of a previously initiated transaction.
     * Returns whether the payment was successful.
     */
    verify(transactionId: string): Promise<VerifyResult>;

    /**
     * Disburse/send money to a MoMo wallet (e.g., artist cashout).
     */
    disburse(params: DisburseParams): Promise<DisburseResult>;

    /**
     * Validate an incoming webhook from the payment provider.
     * Returns true if the webhook signature is valid.
     * For simulated gateway, always returns true.
     */
    validateWebhook(headers: Record<string, string>, body: any): boolean;
}

export default PaymentGateway;
