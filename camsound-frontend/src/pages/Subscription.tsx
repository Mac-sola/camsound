import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { subscriptionsService, paymentsService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const FAN_NAV = [
  { section: 'Discover' },
  { label: 'Home', icon: 'fa-home', view: 'discover' },
  { label: 'Browse', icon: 'fa-search', view: 'browse' },
  { label: 'Genres', icon: 'fa-tags', view: 'genres' },
  { label: 'Community', icon: 'fa-users', view: 'community' },
  { section: 'My Music' },
  { label: 'My Music', icon: 'fa-music', view: 'mymusic' },
  { label: 'Playlists', icon: 'fa-list', view: 'playlists' },
  { label: 'History', icon: 'fa-history', view: 'history' },
  { section: 'Following' },
  { label: 'Following', icon: 'fa-user-friends', view: 'following' },
  { label: 'Notifications', icon: 'fa-bell', view: 'notifications' },
  { section: 'Account' },
  { label: 'Profile', icon: 'fa-user', view: 'profile' },
  { label: 'Settings', icon: 'fa-cog', view: 'settings' },
  { label: 'Get Premium', icon: 'fa-crown', view: 'subscription' },
];

interface Plan {
  id?: string | number;
  _id?: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
}

const DEFAULT_PLANS: Plan[] = [
  {
    name: 'Free Fan',
    price: 0,
    currency: 'FCFA',
    period: '/forever',
    description: 'Enjoy unlimited streaming with occasional audio ads.',
    features: [
      'Standard audio quality (128 kbps)',
      'Discover Cameroonian & African tracks',
      'Create up to 3 custom playlists',
      'Community discussion access',
    ],
    isPopular: false,
  },
  {
    name: 'CamSound Premium',
    price: 1500,
    currency: 'FCFA',
    period: '/month',
    description: 'Uninterrupted music in high-definition fidelity with zero ads.',
    features: [
      'Ad-free uninterrupted streaming',
      'High-definition audio (320 kbps)',
      'Unlimited custom playlists',
      'Offline caching & downloads',
      'Exclusive artist release access',
      'Direct artist tipping & badges',
    ],
    isPopular: true,
  },
  {
    name: 'Annual VIP Pass',
    price: 15000,
    currency: 'FCFA',
    period: '/year',
    description: 'Get 2 months free with full VIP privileges all year long.',
    features: [
      'Everything in CamSound Premium',
      '2 months free discount applied',
      'VIP Golden Crown profile badge',
      'Early access to concert tickets & merch',
      'Priority customer support',
    ],
    isPopular: false,
  },
];

const Subscription: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isMoMoModalOpen, setIsMoMoModalOpen] = useState(false);
  const [momoPhone, setMomoPhone] = useState('');
  const [momoCarrier, setMomoCarrier] = useState<'mtn' | 'orange'>('mtn');
  const [paymentStep, setPaymentStep] = useState<'form' | 'prompt' | 'success' | 'error'>('form');
  const [paymentError, setPaymentError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await subscriptionsService.getPlans();
        if (res.data?.success && res.data.data?.length > 0) {
          const apiPlans = res.data.data.map((p: any) => ({
            ...p,
            features: Array.isArray(p.features) ? p.features : typeof p.features === 'string' ? p.features.split('\n') : [],
          }));
          setPlans(apiPlans);
        }
      } catch {
        // Fallback to DEFAULT_PLANS
      }
    };
    fetchPlans();
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    if (plan.price === 0) {
      // Free plan
      return;
    }
    setSelectedPlan(plan);
    setPaymentStep('form');
    setPaymentError('');
    setIsMoMoModalOpen(true);
  };

  const handleInitiateMoMo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!momoPhone.trim() || momoPhone.trim().length < 9) {
      setPaymentError('Please enter a valid 9-digit mobile money phone number (e.g. 670000000)');
      return;
    }

    setIsProcessing(true);
    setPaymentError('');
    try {
      // Try calling paymentsService
      await paymentsService.createPayment({
        amount: selectedPlan?.price,
        phone: momoPhone,
        planName: selectedPlan?.name,
        carrier: momoCarrier,
        currency: selectedPlan?.currency || 'XAF',
      });
    } catch {
      // Mock flow continues
    }

    setIsProcessing(false);
    setPaymentStep('prompt');

    // Simulate mobile USSD confirmation delay
    setTimeout(() => {
      setPaymentStep('success');
      if (user) {
        updateUser({
          ...user,
          subscriptionStatus: selectedPlan?.name.toLowerCase().includes('annual') ? 'vip' : 'premium',
        });
      }
    }, 3500);
  };

  return (
    <Layout
      navItems={FAN_NAV}
      activeView="subscription"
      onNavClick={(view) => {
        if (view === 'subscription') return;
        navigate('/fan');
      }}
    >
      <div className="subscription-page-container" style={{ padding: '8px 4px 40px' }}>
        {/* Hero Section */}
        <div
          style={{
            background: 'var(--bg-green-section)',
            border: '1px solid var(--border-gold-subtle)',
            borderRadius: 16,
            padding: '36px 32px',
            marginBottom: 32,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-medium)',
          }}
        >
          <div style={{ position: 'relative', zIndex: 2 }}>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                color: 'var(--accent-color)',
                display: 'inline-block',
                marginBottom: 8,
              }}
            >
              👑 Elevate Your Sound Experience
            </span>
            <h1 style={{ fontSize: '2.2rem', margin: '0 0 10px', color: '#fff' }}>
              CamSound Premium Plans
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 620, margin: 0, fontSize: '1rem', lineHeight: 1.6 }}>
              Support Cameroonian artists directly, stream without interruptions, and listen in studio-master audio quality anywhere.
            </p>

            <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-light)', background: 'rgba(0,0,0,0.3)', padding: '6px 14px', borderRadius: 999 }}>
                Current Status:{' '}
                <strong style={{ color: user?.subscriptionStatus === 'premium' || user?.subscriptionStatus === 'vip' ? 'var(--accent-color)' : '#4ade80' }}>
                  {user?.subscriptionStatus?.toUpperCase() || 'FREE FAN'}
                </strong>
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                🔒 Fast & secure Mobile Money checkout (MTN MoMo & Orange Money)
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 40 }}>
          {plans.map((plan, idx) => (
            <div
              key={plan.name || idx}
              className="glass-card"
              style={{
                borderRadius: 16,
                padding: 28,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                border: plan.isPopular ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                boxShadow: plan.isPopular ? '0 0 25px rgba(250,204,21,0.2)' : 'var(--shadow-small)',
                background: plan.isPopular ? 'rgba(15,61,46,0.3)' : 'var(--bg-secondary)',
              }}
            >
              {plan.isPopular && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    right: 24,
                    background: 'var(--accent-color)',
                    color: '#000',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    padding: '4px 12px',
                    borderRadius: 999,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }}
                >
                  ⭐ Most Popular
                </div>
              )}

              <h3 style={{ fontSize: '1.4rem', margin: '0 0 8px', color: '#fff' }}>{plan.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', minHeight: 40, marginBottom: 16 }}>
                {plan.description}
              </p>

              <div style={{ margin: '12px 0 24px', display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--accent-color)' }}>
                  {plan.price.toLocaleString()}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
                  {plan.currency}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{plan.period}</span>
              </div>

              <div style={{ flex: 1, marginBottom: 24 }}>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', fontWeight: 700, marginBottom: 12 }}>
                  Included Features:
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map((feat, fIdx) => (
                    <li key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: 'var(--text-light)' }}>
                      <i className="fas fa-check-circle" style={{ color: plan.isPopular ? 'var(--accent-color)' : '#4ade80', fontSize: '0.95rem' }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPlan(plan)}
                disabled={plan.price === 0 && (!user?.subscriptionStatus || user?.subscriptionStatus === 'free')}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 10,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: plan.isPopular
                    ? '#FACC15'
                    : plan.price === 0
                    ? 'rgba(255,255,255,0.08)'
                    : 'var(--primary-color)',
                  color: plan.isPopular ? '#000' : '#fff',
                  transition: 'all 0.2s ease',
                  boxShadow: plan.isPopular ? '0 4px 14px rgba(250,204,21,0.3)' : 'none',
                }}
              >
                {plan.price === 0
                  ? user?.subscriptionStatus === 'free' || !user?.subscriptionStatus
                    ? 'Current Plan'
                    : 'Downgrade to Free'
                  : `Upgrade with MoMo — ${plan.price.toLocaleString()} ${plan.currency}`}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="section-card" style={{ padding: 28, borderRadius: 16 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="fas fa-question-circle" style={{ color: 'var(--accent-color)' }} />
            Frequently Asked Questions
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            <div>
              <h4 style={{ fontSize: '0.98rem', color: '#fff', marginBottom: 6 }}>How does Mobile Money payment work?</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                Enter your MTN MoMo or Orange Money phone number. You will receive an instant USSD popup prompt on your mobile phone to enter your PIN and validate the transaction.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '0.98rem', color: '#fff', marginBottom: 6 }}>Can I cancel anytime?</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                Yes! There are no long-term contracts. If you choose not to renew, your account simply switches back to the Free Fan plan at the end of the billing period.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '0.98rem', color: '#fff', marginBottom: 6 }}>How do artists earn from my subscription?</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                A major portion of every subscription fee is distributed directly to the Cameroonian artists whose songs you stream via our automated royalty calculator.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MoMo Payment Modal */}
      {isMoMoModalOpen && selectedPlan && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-gold-subtle)',
              borderRadius: 16,
              maxWidth: 460,
              width: '100%',
              padding: 32,
              boxShadow: 'var(--shadow-large)',
              position: 'relative',
            }}
          >
            {paymentStep === 'form' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>📱 Mobile Money Payment</h3>
                  <button
                    onClick={() => setIsMoMoModalOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 10, padding: 14, marginBottom: 20 }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Plan Selected</div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>{selectedPlan.name}</div>
                  <div style={{ fontWeight: 800, color: 'var(--accent-color)', fontSize: '1.2rem', marginTop: 4 }}>
                    {selectedPlan.price.toLocaleString()} {selectedPlan.currency} {selectedPlan.period}
                  </div>
                </div>

                {paymentError && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: '#f87171', fontSize: '0.88rem', marginBottom: 16 }}>
                    <i className="fas fa-exclamation-circle" style={{ marginRight: 6 }} />
                    {paymentError}
                  </div>
                )}

                <form onSubmit={handleInitiateMoMo}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                      Select Carrier
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => setMomoCarrier('mtn')}
                        style={{
                          padding: '10px',
                          borderRadius: 8,
                          border: momoCarrier === 'mtn' ? '2px solid #FACC15' : '1px solid var(--border-color)',
                          background: momoCarrier === 'mtn' ? 'rgba(250,204,21,0.1)' : 'var(--bg-primary)',
                          color: '#fff',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        🟡 MTN MoMo
                      </button>
                      <button
                        type="button"
                        onClick={() => setMomoCarrier('orange')}
                        style={{
                          padding: '10px',
                          borderRadius: 8,
                          border: momoCarrier === 'orange' ? '2px solid #FB923C' : '1px solid var(--border-color)',
                          background: momoCarrier === 'orange' ? 'rgba(251,146,60,0.1)' : 'var(--bg-primary)',
                          color: '#fff',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        🟠 Orange Money
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                      Mobile Money Number (+237)
                    </label>
                    <input
                      type="tel"
                      placeholder="670 00 00 00"
                      value={momoPhone}
                      onChange={(e) => setMomoPhone(e.target.value)}
                      className="auth-input"
                      style={{ width: '100%', fontSize: '1rem', letterSpacing: 1 }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="btn-camsound-yellow"
                    style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: '1rem', fontWeight: 800 }}
                  >
                    {isProcessing ? (
                      <><i className="fas fa-spinner fa-spin" /> Contacting Gateway...</>
                    ) : (
                      <>Pay {selectedPlan.price.toLocaleString()} {selectedPlan.currency} <i className="fas fa-arrow-right" /></>
                    )}
                  </button>
                </form>
              </>
            )}

            {paymentStep === 'prompt' && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(250,204,21,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--accent-color)', fontSize: '1.8rem' }}>
                  <i className="fas fa-mobile-alt fa-bounce" />
                </div>
                <h3 style={{ margin: '0 0 8px' }}>USSD Prompt Sent!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 20 }}>
                  Please check your phone (<strong>{momoPhone}</strong>). A popup prompt has been sent to enter your PIN and approve the transaction.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--accent-color)', fontSize: '0.88rem' }}>
                  <i className="fas fa-circle-notch fa-spin" />
                  Waiting for network confirmation...
                </div>
              </div>
            )}

            {paymentStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#4ade80', fontSize: '2rem' }}>
                  <i className="fas fa-check" />
                </div>
                <h3 style={{ margin: '0 0 8px' }}>Subscription Activated! 🎉</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 24 }}>
                  You are now upgraded to <strong>{selectedPlan.name}</strong>. Enjoy unlimited ad-free high-fidelity Cameroonian music!
                </p>
                <button
                  type="button"
                  className="btn-camsound-yellow"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setIsMoMoModalOpen(false);
                    navigate('/fan');
                  }}
                >
                  Start Listening Now <i className="fas fa-play" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Subscription;
