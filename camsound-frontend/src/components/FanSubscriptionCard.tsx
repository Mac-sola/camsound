import React, { useState, useEffect } from 'react';
import { subscriptionsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface ActiveSubData {
  hasAccess: boolean;
  tier: 'free' | 'premium' | 'vip';
  daysRemaining: number;
  subscription: {
    _id: string;
    planName: string;
    amount: number;
    currency: string;
    startDate: string;
    endDate: string;
    status: string;
    autoRenew: boolean;
  } | null;
}

const FanSubscriptionCard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState<ActiveSubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchActiveSubscription();
  }, []);

  const fetchActiveSubscription = async () => {
    try {
      const res = await subscriptionsService.getMyActive();
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await subscriptionsService.cancelSubscription(cancelReason || undefined);
      setShowCancelConfirm(false);
      setCancelReason('');
      fetchActiveSubscription();
    } catch {
      // Error handling
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
        <i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />
        Loading subscription status...
      </div>
    );
  }

  const sub = data?.subscription;
  const isActive = data?.hasAccess && sub;
  const tierColor = data?.tier === 'vip' ? '#FACC15' : data?.tier === 'premium' ? '#10b981' : 'var(--text-muted)';
  const tierIcon = data?.tier === 'vip' ? 'fa-gem' : data?.tier === 'premium' ? 'fa-crown' : 'fa-user';

  // Progress bar calculation
  let progressPercent = 0;
  if (sub) {
    const start = new Date(sub.startDate).getTime();
    const end = new Date(sub.endDate).getTime();
    const now = Date.now();
    const total = end - start;
    const elapsed = now - start;
    progressPercent = Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  return (
    <div
      className="glass-card"
      style={{
        borderRadius: 16,
        padding: 24,
        border: isActive ? `1px solid ${tierColor}40` : '1px solid var(--border-color)',
        background: isActive ? `linear-gradient(135deg, rgba(15,61,46,0.2), rgba(0,0,0,0.1))` : 'var(--bg-secondary)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `${tierColor}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: tierColor,
              fontSize: '1.2rem',
            }}
          >
            <i className={`fas ${tierIcon}`} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>
              {t('sub.my_subscription', 'My Subscription')}
            </h3>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                color: tierColor,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {data?.tier?.toUpperCase() || 'FREE'} {isActive ? '• ACTIVE' : ''}
            </span>
          </div>
        </div>
        {isActive && (
          <span
            style={{
              background: `${tierColor}20`,
              color: tierColor,
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            {data?.daysRemaining} {t('sub.days_left', 'days left')}
          </span>
        )}
      </div>

      {isActive && sub ? (
        <>
          {/* Plan Details */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('sub.plan_label', 'Plan')}</span>
              <span style={{ color: '#fff', fontWeight: 700 }}>{sub.planName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('sub.amount_label', 'Amount')}</span>
              <span style={{ color: tierColor, fontWeight: 700 }}>
                {sub.amount.toLocaleString()} {sub.currency || 'FCFA'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('sub.start_date', 'Started')}</span>
              <span style={{ color: 'var(--text-light)' }}>
                {new Date(sub.startDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{t('sub.end_date', 'Expires')}</span>
              <span style={{ color: (data?.daysRemaining || 0) <= 7 ? '#f87171' : 'var(--text-light)', fontWeight: (data?.daysRemaining || 0) <= 7 ? 700 : 400 }}>
                {new Date(sub.endDate).toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                height: 6,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: progressPercent > 85 ? '#f87171' : `linear-gradient(90deg, ${tierColor}, #10b981)`,
                  borderRadius: 999,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>{Math.round(progressPercent)}% elapsed</span>
              <span>{data?.daysRemaining} days remaining</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <a
              href="/subscription"
              style={{
                flex: 1,
                padding: '10px 16px',
                background: tierColor,
                color: '#000',
                border: 'none',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'none',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <i className="fas fa-sync-alt" /> {t('sub.renew', 'Renew / Upgrade')}
            </a>
            <button
              onClick={() => setShowCancelConfirm(true)}
              style={{
                padding: '10px 16px',
                background: 'rgba(248,113,113,0.1)',
                color: '#f87171',
                border: '1px solid rgba(248,113,113,0.25)',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {t('sub.cancel', 'Cancel')}
            </button>
          </div>

          {/* Cancel Confirmation */}
          {showCancelConfirm && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 12,
              }}
            >
              <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: '0 0 12px' }}>
                {t('sub.cancel_confirm', 'Are you sure? You\'ll lose premium access when your current period ends.')}
              </p>
              <input
                type="text"
                placeholder={t('sub.cancel_reason', 'Reason (optional)')}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: '0.85rem',
                  marginBottom: 10,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  {cancelling ? 'Cancelling...' : t('sub.confirm_cancel', 'Yes, Cancel')}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'var(--text-light)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  {t('sub.keep', 'Keep Subscription')}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* No Active Subscription */
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎵</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
            {t('sub.no_active', 'You\'re on the Free plan. Upgrade to unlock premium features!')}
          </p>
          <a
            href="/subscription"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              background: 'var(--accent-color)',
              color: '#000',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            <i className="fas fa-crown" /> {t('sub.get_premium', 'Get Premium')}
          </a>
        </div>
      )}
    </div>
  );
};

export default FanSubscriptionCard;
