import React, { useState, useEffect } from 'react';
import { subscriptionsService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface PaymentRecord {
  _id: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  transactionId?: string;
  phone?: string;
  purpose: string;
  status: string;
  createdAt: string;
}

const FanPaymentHistory: React.FC = () => {
  const { t } = useLanguage();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await subscriptionsService.getMyPayments();
      if (res.data?.success) {
        setPayments(res.data.data || []);
      }
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all' ? payments : payments.filter((p) => p.purpose === filter);

  const statusColor: Record<string, string> = {
    completed: '#10b981',
    pending: '#FACC15',
    failed: '#f87171',
    refunded: '#8b5cf6',
  };

  const purposeIcon: Record<string, string> = {
    subscription: 'fa-crown',
    tip: 'fa-heart',
    withdrawal: 'fa-wallet',
    other: 'fa-receipt',
  };

  const purposeLabel: Record<string, string> = {
    subscription: 'Subscription',
    tip: 'Artist Tip',
    withdrawal: 'Withdrawal',
    other: 'Payment',
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
        <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />
        Loading payment history...
      </div>
    );
  }

  return (
    <div
      className="glass-card"
      style={{
        borderRadius: 16,
        padding: 24,
        border: '1px solid var(--border-color)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fas fa-receipt" style={{ color: 'var(--accent-color)', fontSize: '1.1rem' }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>
            {t('payments.title', 'Payment History')}
          </h3>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {filtered.length} {t('payments.transactions', 'transactions')}
        </span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'subscription', 'tip', 'withdrawal'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: filter === f ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.1)',
              background: filter === f ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.04)',
              color: filter === f ? 'var(--accent-color)' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f === 'all' ? t('payments.all', 'All') : purposeLabel[f] || f}
          </button>
        ))}
      </div>

      {/* Payment List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
          <i className="fas fa-inbox" style={{ fontSize: '1.5rem', marginBottom: 8, display: 'block' }} />
          <p style={{ margin: 0, fontSize: '0.88rem' }}>{t('payments.none', 'No payment records found')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((payment) => (
            <div
              key={payment._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'background 0.15s ease',
              }}
            >
              {/* Left: Icon + Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: `${statusColor[payment.status] || '#666'}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: statusColor[payment.status] || '#666',
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}
                >
                  <i className={`fas ${purposeIcon[payment.purpose] || 'fa-receipt'}`} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>
                    {purposeLabel[payment.purpose] || payment.purpose}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span>{new Date(payment.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
                    {payment.transactionId && (
                      <span style={{ fontFamily: 'monospace', opacity: 0.7 }}>
                        {payment.transactionId.substring(0, 16)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Amount + Status */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: statusColor[payment.status] || '#fff' }}>
                  {payment.purpose === 'withdrawal' ? '-' : '+'}{payment.amount.toLocaleString()}{' '}
                  <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>{payment.currency || 'FCFA'}</span>
                </div>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: statusColor[payment.status] || '#666',
                    letterSpacing: 0.5,
                  }}
                >
                  {payment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FanPaymentHistory;
