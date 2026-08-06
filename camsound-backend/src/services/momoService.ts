import { Request } from 'express';

/**
 * Simple MoMo integration stub/service.
 * - When `MOMO_ENABLED` is true and real credentials are configured, replace these stubs
 *   with the provider SDK calls.
 * - For now this provides a simulated checkout URL and a webhook verifier to test flows.
 */

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const initiatePayment = async (amount: number, phone?: string, transactionId?: string) => {
    // Generate a transaction id if not provided
    const tx = transactionId || `MOMO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // In a real integration you'd call the MoMo API here and return a checkout URL or payment token
    await simulateDelay(250);

    return {
        transactionId: tx,
        // Simulated checkout URL (for client-side redirect or USSD flow simulation)
        checkoutUrl: `https://momo.example/simulate-pay?tx=${tx}&amount=${amount}`,
        message: 'Simulated MoMo checkout created',
    };
};

export const verifyTransaction = async (transactionId: string) => {
    // Simulate verifying with the payment provider
    await simulateDelay(150);
    // For demo purposes, treat transactions ending with even digit as successful
    const last = parseInt(transactionId.slice(-1), 10);
    const success = !Number.isNaN(last) ? (last % 2 === 0) : true;
    return {
        transactionId,
        success,
        providerStatus: success ? 'COMPLETED' : 'FAILED',
        message: success ? 'Payment completed (simulated)' : 'Payment failed (simulated)'
    };
};

// Helper to extract phone from request body for server-side initiate endpoint
export const getPhoneFromReq = (req: Request) => {
    return (req.body && (req.body.phone || req.body.momo_number)) || undefined;
};

export default { initiatePayment, verifyTransaction, getPhoneFromReq };
