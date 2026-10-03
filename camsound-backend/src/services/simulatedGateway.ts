/**
 * Simulated Payment Gateway
 * 
 * Implements the PaymentGateway interface with simulated delays and
 * always-successful responses. Used for development and demo purposes.
 * 
 * When ready for production, replace with a real gateway (Campay, Fapshi, etc.)
 * by setting PAYMENT_GATEWAY env var.
 */

import {
    PaymentGateway,
    InitiateParams,
    InitiateResult,
    VerifyResult,
    DisburseParams,
    DisburseResult,
} from './paymentGateway';

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateTxId = (prefix: string = 'MOMO') =>
    `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export class SimulatedGateway implements PaymentGateway {
    name = 'MTN MoMo Simulated';
    isSimulated = true;

    async initiate(params: InitiateParams): Promise<InitiateResult> {
        await simulateDelay(200);

        const txId = params.externalReference || generateTxId('MOMO');

        return {
            transactionId: txId,
            status: 'pending',
            checkoutUrl: `https://momo.sandbox.mtn.cm/pay?tx=${txId}&amount=${params.amount}`,
            ussdCode: `*126*1*${params.amount}#`,
            message: `MoMo prompt dispatched to ${params.phone || 'subscriber'} (simulated)`,
        };
    }

    async verify(transactionId: string): Promise<VerifyResult> {
        await simulateDelay(150);

        // In simulation mode, all payments succeed
        return {
            transactionId,
            success: true,
            providerStatus: 'SUCCESSFUL',
            financialTransactionId: `MTN-FT-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
            message: 'Payment completed and verified (simulated)',
            timestamp: new Date().toISOString(),
        };
    }

    async disburse(params: DisburseParams): Promise<DisburseResult> {
        await simulateDelay(250);

        const txId = params.externalReference || generateTxId('PAYOUT');
        const fee = Math.round(params.amount * 0.02); // 2% fee
        const net = params.amount - fee;

        return {
            transactionId: txId,
            success: true,
            amount: params.amount,
            fee,
            netAmount: net,
            recipientPhone: params.phone,
            status: 'COMPLETED',
            message: `Disbursement of ${net.toLocaleString()} ${params.reason ? `(${params.reason})` : ''} XAF successfully transferred to ${params.phone} (Fee: ${fee} XAF) [simulated]`,
            timestamp: new Date().toISOString(),
        };
    }

    validateWebhook(_headers: Record<string, string>, _body: any): boolean {
        // Simulated gateway always accepts webhooks
        return true;
    }
}

export default SimulatedGateway;
