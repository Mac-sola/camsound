import { Request, Response } from 'express';
import Payment from '../models/Payment';
import { initiatePayment } from '../services/momoService';

const generateTransactionId = () => `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export const getPayments = async (req: Request, res: Response) => {
    try {
        const isAdmin = req.user?.type === 'admin';
        const filter = isAdmin ? {} : { userId: req.user?.id };
        const payments = await Payment.find(filter).populate('userId', 'name email').sort({ createdAt: -1 });
        res.json({ success: true, data: payments });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createPayment = async (req: Request, res: Response) => {
    try {
        const { subscriptionId, amount, currency, paymentMethod, transactionId, status } = req.body;
        if (!amount) return res.status(400).json({ success: false, message: 'Amount is required' });

        const tx = transactionId || generateTransactionId();
        const payment = await Payment.create({
            userId: req.user?.id,
            subscriptionId,
            amount,
            currency: currency || 'XAF',
            paymentMethod: paymentMethod || 'MoMo',
            transactionId: tx,
            status: status || 'pending',
        });

        if ((paymentMethod || 'MoMo').toLowerCase() === 'momo') {
            const phone = (req.body.phone || req.body.momoNumber || req.body.momo_number) as string | undefined;
            const checkout = await initiatePayment(amount, phone, payment.transactionId);
            return res.status(201).json({ success: true, data: payment, checkout });
        }

        res.status(201).json({ success: true, data: payment });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        const payment = await Payment.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
        res.json({ success: true, data: payment });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
