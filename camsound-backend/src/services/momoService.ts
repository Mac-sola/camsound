import { Request } from 'express';

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const initiatePayment = async (amount: number, phone?: string, transactionId?: string) => {
    const tx = transactionId || `MOMO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    await simulateDelay(200);

    return {
        transactionId: tx,
        status: 'PENDING_USER_CONFIRMATION',
        phone: phone || '',
        amount,
        currency: 'XAF',
        provider: 'MTN MoMo Cameroon',
        checkoutUrl: `https://momo.sandbox.mtn.cm/pay?tx=${tx}&amount=${amount}`,
        message: `MoMo prompt dispatched to ${phone || 'subscriber'}`,
    };
};

export const verifyTransaction = async (transactionId: string) => {
    await simulateDelay(150);
    // In simulation mode, treat as successful
    return {
        transactionId,
        success: true,
        providerStatus: 'SUCCESSFUL',
        financialTransactionId: `MTN-FT-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        message: 'Payment completed and verified on MTN Mobile Money network',
        timestamp: new Date().toISOString(),
    };
};

export const disbursePayment = async (amount: number, phone: string, withdrawalId?: string) => {
    await simulateDelay(250);
    const tx = `PAYOUT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const fee = Math.round(amount * 0.02);
    const net = amount - fee;

    return {
        transactionId: tx,
        withdrawalId,
        success: true,
        amount,
        fee,
        netAmount: net,
        recipientPhone: phone,
        provider: 'MTN MoMo Cameroon',
        status: 'COMPLETED',
        message: `Disbursement of ${net.toLocaleString()} XAF successfully transferred to ${phone} (Fee: ${fee} XAF)`,
        timestamp: new Date().toISOString(),
    };
};

export const getPhoneFromReq = (req: Request) => {
    return (req.body && (req.body.phone || req.body.momoNumber || req.body.momo_number || req.body.phoneNumber)) || undefined;
};

export default { initiatePayment, verifyTransaction, disbursePayment, getPhoneFromReq };

