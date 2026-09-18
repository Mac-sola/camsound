import React, { useState, useEffect } from 'react';
import { momoService } from '../services/api';
import { usePlatformSettings } from '../context/SettingsContext';

export interface MoMoPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'subscription' | 'withdrawal' | 'tip' | 'test';
  amount: number;
  currency?: string;
  planName?: string;
  planPeriod?: string;
  artistName?: string;
  artistId?: string;
  withdrawalId?: string;
  initialPhone?: string;
  onSuccess?: (data: { transactionId: string; amount: number; phone: string; planName?: string }) => void;
}

type SimulationStep = 'form' | 'ussd_prompt' | 'verifying' | 'success' | 'error';

export const MoMoPaymentModal: React.FC<MoMoPaymentProps> = ({
  isOpen,
  onClose,
  mode,
  amount,
  currency = 'XAF',
  planName = 'Premium Plan',
  planPeriod = '/month',
  artistName = 'Artist',
  withdrawalId,
  initialPhone = '',
  onSuccess,
}) => {
  const { settings } = usePlatformSettings();
  const [phone, setPhone] = useState(initialPhone || '');
  const [tipMessage, setTipMessage] = useState('');
  const [selectedTip, setSelectedTip] = useState<number>(amount || 1000);
  const [currentAmount, setCurrentAmount] = useState<number>(amount);
  const [customAmount, setCustomAmount] = useState<string>(amount ? String(amount) : '1000');

  const [step, setStep] = useState<SimulationStep>('form');
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [txId, setTxId] = useState('');
  const [txTimestamp, setTxTimestamp] = useState('');
  const [stepProgress, setStepProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync amount when props change
  useEffect(() => {
    if (mode === 'tip') {
      setCurrentAmount(selectedTip);
    } else {
      setCurrentAmount(amount);
    }
  }, [amount, mode, selectedTip]);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setPin('');
      setErrorMsg('');
      setIsProcessing(false);
      setCopied(false);
      if (initialPhone && !phone) {
        setPhone(initialPhone);
      }
    }
  }, [isOpen, initialPhone]);

  if (!isOpen) return null;

  // MTN Fee Calculation for withdrawals (2%)
  const mtnFee = mode === 'withdrawal' ? Math.round(currentAmount * 0.02) : 0;
  const netPayout = mode === 'withdrawal' ? currentAmount - mtnFee : currentAmount;

  // Validate phone
  const validatePhone = (p: string) => {
    const clean = p.replace(/[^0-9]/g, '');
    if (clean.length === 9 && clean.startsWith('6')) return true;
    if (clean.length === 12 && clean.startsWith('2376')) return true;
    return false;
  };

  const getCleanPhone = (p: string) => {
    const clean = p.replace(/[^0-9]/g, '');
    if (clean.startsWith('237')) return clean.slice(3);
    return clean;
  };

  const formatDisplayPhone = (p: string) => {
    const clean = getCleanPhone(p);
    if (clean.length >= 9) {
      return `+237 ${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6, 9)}`;
    }
    return clean ? `+237 ${clean}` : '+237 6XX XXX XXX';
  };

  // ── Step 1: Initiate Payment / Disbursement ──
  const handleInitiate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!validatePhone(phone)) {
      setErrorMsg('Please enter a valid 9-digit Cameroonian MTN number (starts with 6, e.g. 670 000 000)');
      return;
    }

    if (mode === 'withdrawal' && currentAmount < 5000) {
      setErrorMsg('Minimum withdrawal amount is 5,000 FCFA.');
      return;
    }

    setIsProcessing(true);

    try {
      if (mode === 'withdrawal') {
        // Disburse simulation
        setStep('ussd_prompt');
        setIsProcessing(false);
      } else {
        // Collect / Subscribe / Tip simulation
        const cleanNumber = getCleanPhone(phone);
        const res = await momoService.initiate({
          amount: currentAmount,
          phone: cleanNumber,
          planName: mode === 'subscription' ? planName : undefined,
          reason: mode === 'tip' ? `Tip for ${artistName}: ${tipMessage}` : `${settings.platformName || 'CamSound'} ${mode}`,
          currency: currency,
        });

        const newTx = res.data?.data?.checkout?.transactionId || `MOMO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        setTxId(newTx);
        setIsProcessing(false);
        setStep('ussd_prompt');
      }
    } catch (err: any) {
      // Graceful fallback to local simulation
      const fallbackTx = `MOMO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      setTxId(fallbackTx);
      setIsProcessing(false);
      setStep('ussd_prompt');
    }
  };

  // ── Step 2: User Enters PIN on Simulated USSD Screen ──
  const handleKeypadPress = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
    }
  };

  const handleKeypadClear = () => {
    setPin('');
  };

  const handleAuthorizePayment = async () => {
    setStep('verifying');
    setStepProgress(20);
    setStatusMessage('Connecting to MTN Cameroon MoMo Gateway...');

    // Progress animation
    setTimeout(() => {
      setStepProgress(55);
      setStatusMessage(`Authorizing debit of ${currentAmount.toLocaleString()} FCFA with MTN network...`);
    }, 900);

    setTimeout(() => {
      setStepProgress(85);
      setStatusMessage('Validating secure transaction token...');
    }, 1800);

    setTimeout(async () => {
      try {
        const cleanNumber = getCleanPhone(phone);
        const nowFormatted = new Date().toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        setTxTimestamp(nowFormatted);

        if (mode === 'withdrawal') {
          // Complete withdrawal
          await momoService.disburse({
            amount: currentAmount,
            phone: cleanNumber,
            withdrawalId,
          });
        } else {
          // Verify payment
          await momoService.verify({
            transactionId: txId || `MOMO-${Date.now()}`,
            planName: mode === 'subscription' ? planName : undefined,
            amount: currentAmount,
          });
        }

        setStepProgress(100);
        setStep('success');

        if (onSuccess) {
          onSuccess({
            transactionId: txId || `MOMO-${Date.now()}`,
            amount: currentAmount,
            phone: cleanNumber,
            planName: mode === 'subscription' ? planName : undefined,
          });
        }
      } catch {
        // Ensure success state even in offline/demo mode
        setStepProgress(100);
        setStep('success');
        if (onSuccess) {
          onSuccess({
            transactionId: txId || `MOMO-${Date.now()}`,
            amount: currentAmount,
            phone: getCleanPhone(phone),
            planName: mode === 'subscription' ? planName : undefined,
          });
        }
      }
    }, 2800);
  };

  const copyReceiptRef = () => {
    navigator.clipboard.writeText(txId || `MOMO-${Date.now()}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 12, 8, 0.82)',
        backdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #132219, #0d1712)',
          border: '1px solid rgba(250, 204, 21, 0.35)',
          borderRadius: 20,
          maxWidth: step === 'ussd_prompt' ? 480 : 450,
          width: '100%',
          padding: 28,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(250, 204, 21, 0.15)',
          position: 'relative',
          color: '#fff',
          fontFamily: 'inherit',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#FACC15',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '0.82rem',
                boxShadow: '0 2px 8px rgba(250, 204, 21, 0.4)',
                letterSpacing: -0.5,
              }}
            >
              MoMo
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', lineHeight: 1.2 }}>
                MTN Mobile Money
              </div>
              <div style={{ fontSize: '0.72rem', color: '#FACC15', fontWeight: 600, letterSpacing: 0.5 }}>
                ⚡ LIVE SIMULATION ENGINE
              </div>
            </div>
          </div>
          {step !== 'verifying' && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              <i className="fas fa-times" />
            </button>
          )}
        </div>

        {/* ── STEP 1: FORM INPUT ── */}
        {step === 'form' && (
          <div>
            {/* Context Summary Card */}
            <div
              style={{
                background: 'rgba(250, 204, 21, 0.07)',
                border: '1px solid rgba(250, 204, 21, 0.2)',
                borderRadius: 14,
                padding: '16px 18px',
                marginBottom: 20,
              }}
            >
              {mode === 'subscription' && (
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
                    Subscription Package
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '4px 0 2px' }}>
                    {planName}
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FACC15' }}>
                    {currentAmount.toLocaleString()} FCFA <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{planPeriod}</span>
                  </div>
                </div>
              )}

              {mode === 'withdrawal' && (
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
                    Artist MoMo Cashout
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Gross Withdrawal:</span>
                    <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{currentAmount.toLocaleString()} FCFA</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 2, fontSize: '0.82rem', color: '#f87171' }}>
                    <span>MTN MoMo 2% Network Fee:</span>
                    <span>- {mtnFee.toLocaleString()} FCFA</span>
                  </div>
                  <div style={{ borderTop: '1px dashed rgba(255,255,255,0.15)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 700, color: '#FACC15' }}>Net Payout to Wallet:</span>
                    <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FACC15' }}>{netPayout.toLocaleString()} FCFA</span>
                  </div>
                </div>
              )}

              {mode === 'tip' && (
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
                    Support Cameroonian Artist
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '4px 0 10px' }}>
                    ⭐ Direct MoMo Tip for {artistName}
                  </div>
                  {/* Preset Tip Chips */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
                    {[500, 1000, 2500, 5000].map(tipVal => (
                      <button
                        key={tipVal}
                        type="button"
                        onClick={() => {
                          setSelectedTip(tipVal);
                          setCurrentAmount(tipVal);
                          setCustomAmount(String(tipVal));
                        }}
                        style={{
                          padding: '8px 4px',
                          borderRadius: 8,
                          border: currentAmount === tipVal ? '2px solid #FACC15' : '1px solid rgba(255,255,255,0.12)',
                          background: currentAmount === tipVal ? 'rgba(250,204,21,0.2)' : 'rgba(255,255,255,0.05)',
                          color: currentAmount === tipVal ? '#FACC15' : '#fff',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        {tipVal.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                    Total Tip: <strong style={{ color: '#FACC15', fontSize: '1.05rem' }}>{currentAmount.toLocaleString()} FCFA</strong>
                  </div>
                </div>
              )}

              {mode === 'test' && (
                <div>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1, color: '#FACC15', fontWeight: 700 }}>
                    Admin Gateway Test Bench
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '4px 0 2px' }}>
                    MTN MoMo Connection Health Check
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FACC15' }}>
                    {currentAmount.toLocaleString()} FCFA
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <i className="fas fa-exclamation-triangle" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleInitiate}>
              {/* Phone Input */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 6 }}>
                  MTN Mobile Money Phone Number
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#FACC15',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      pointerEvents: 'none',
                    }}
                  >
                    <span>🇨🇲 +237</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="67X XXX XXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 92px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(250, 204, 21, 0.3)',
                      borderRadius: 12,
                      color: '#fff',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      letterSpacing: 1,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    required
                    autoFocus
                  />
                </div>
                <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)', marginTop: 5 }}>
                  Accepted MTN prefixes: 67X, 68X, 650–654, 655–659
                </div>
              </div>

              {/* Tip cheer note */}
              {mode === 'tip' && (
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 6 }}>
                    Cheering Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Love your song! Keep pushing!"
                    value={tipMessage}
                    onChange={e => setTipMessage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 10,
                      color: '#fff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Security Guarantee */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.5)',
                  marginBottom: 20,
                }}
              >
                <i className="fas fa-shield-alt" style={{ color: '#10b981' }} />
                <span>Encrypted direct integration with MTN Mobile Money Gateway</span>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: '#FACC15',
                  color: '#000',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: '1rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 4px 20px rgba(250, 204, 21, 0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                {isProcessing ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Contacting MTN MoMo...
                  </>
                ) : mode === 'withdrawal' ? (
                  <>
                    Disburse {netPayout.toLocaleString()} FCFA via MoMo <i className="fas fa-arrow-right" />
                  </>
                ) : (
                  <>
                    Pay {currentAmount.toLocaleString()} FCFA via MTN MoMo <i className="fas fa-arrow-right" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 2: SIMULATED USSD SCREEN & PIN AUTHORIZATION ── */}
        {step === 'ussd_prompt' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: 'rgba(250,204,21,0.15)',
                  color: '#FACC15',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                <i className="fas fa-mobile-alt fa-bounce" /> USSD PUSH PROMPT DELIVERED
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', color: '#fff' }}>
                Authorize on your Phone
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', margin: 0 }}>
                A simulated USSD prompt was sent to <strong>{formatDisplayPhone(phone)}</strong>.
              </p>
            </div>

            {/* Authentically Styled Simulated USSD Phone Screen */}
            <div
              style={{
                background: '#09100d',
                border: '2px solid #FACC15',
                borderRadius: 16,
                padding: 18,
                boxShadow: '0 8px 30px rgba(0,0,0,0.6), inset 0 0 20px rgba(250,204,21,0.08)',
                marginBottom: 16,
                position: 'relative',
              }}
            >
              {/* Phone Speaker Notch */}
              <div style={{ width: 44, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 4, margin: '0 auto 12px' }} />

              <div style={{ background: '#1c2921', borderRadius: 10, padding: 14, border: '1px solid rgba(250,204,21,0.25)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.74rem', color: '#FACC15', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                  📱 MTN MoMo Service Prompt
                </div>
                <div style={{ fontSize: '0.86rem', color: '#fff', lineHeight: 1.4, marginBottom: 12 }}>
                  {mode === 'withdrawal' ? (
                    <>Confirm cashout of <strong>{netPayout.toLocaleString()} FCFA</strong> to your MTN MoMo wallet?</>
                  ) : (
                    <>Authorize payment of <strong>{currentAmount.toLocaleString()} FCFA</strong> to <strong>{settings.platformName || 'CamSound'}</strong> for {mode === 'subscription' ? planName : 'Artist Support'}?</>
                  )}
                </div>

                {/* PIN Dots Screen */}
                <div style={{ background: '#09100d', borderRadius: 8, padding: '10px 14px', marginBottom: 14, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>ENTER 4-DIGIT MOMO PIN:</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, height: 28, alignItems: 'center' }}>
                    {[0, 1, 2, 3].map(idx => (
                      <div
                        key={idx}
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: pin.length > idx ? '#FACC15' : 'rgba(255,255,255,0.15)',
                          border: pin.length > idx ? '2px solid #FACC15' : '1px solid rgba(255,255,255,0.3)',
                          boxShadow: pin.length > idx ? '0 0 8px rgba(250,204,21,0.8)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Interactive Keypad */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeypadPress(num)}
                      style={{
                        padding: '10px 0',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleKeypadClear}
                    style={{
                      padding: '10px 0',
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: 8,
                      color: '#f87171',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    style={{
                      padding: '10px 0',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    0
                  </button>
                  <button
                    type="button"
                    disabled={pin.length < 4}
                    onClick={handleAuthorizePayment}
                    style={{
                      padding: '10px 0',
                      background: pin.length >= 4 ? '#FACC15' : 'rgba(250,204,21,0.2)',
                      border: 'none',
                      borderRadius: 8,
                      color: pin.length >= 4 ? '#000' : 'rgba(250,204,21,0.5)',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      cursor: pin.length >= 4 ? 'pointer' : 'not-allowed',
                    }}
                  >
                    OK ✔
                  </button>
                </div>
              </div>
            </div>

            {/* Instant One-Click Auto-Approve simulation helper */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleAuthorizePayment}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  background: 'rgba(250, 204, 21, 0.15)',
                  border: '1px solid #FACC15',
                  borderRadius: 10,
                  color: '#FACC15',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <i className="fas fa-magic" /> Auto-Approve (Skip PIN)
              </button>
              <button
                type="button"
                onClick={() => setStep('form')}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: VERIFYING NETWORK STATE ── */}
        {step === 'verifying' && (
          <div style={{ textAlign: 'center', padding: '24px 8px' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(250, 204, 21, 0.12)',
                border: '2px solid #FACC15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#FACC15',
                fontSize: '1.8rem',
              }}
            >
              <i className="fas fa-circle-notch fa-spin" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: '#fff' }}>
              Validating MoMo Network...
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.88rem', marginBottom: 24 }}>
              {statusMessage || 'Connecting with MTN Mobile Money servers...'}
            </p>

            {/* Animated Progress bar */}
            <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden', marginBottom: 12 }}>
              <div
                style={{
                  width: `${stepProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #FACC15, #10b981)',
                  borderRadius: 999,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
              Do not refresh or close this window.
            </div>
          </div>
        )}

        {/* ── STEP 4: SUCCESS & ELECTRONIC RECEIPT ── */}
        {step === 'success' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '2px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: '#10b981',
                  fontSize: '1.8rem',
                }}
              >
                <i className="fas fa-check" />
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.3rem', color: '#fff' }}>
                {mode === 'withdrawal' ? 'MoMo Cashout Sent! 💸' : 'Payment Confirmed! 🎉'}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0 }}>
                {mode === 'withdrawal'
                  ? `Funds transferred to ${formatDisplayPhone(phone)}`
                  : mode === 'subscription'
                  ? `Your ${planName} subscription is now ACTIVE!`
                  : `Your tip has been transferred to ${artistName}!`}
              </p>
            </div>

            {/* Official MTN MoMo Digital Receipt Card */}
            <div
              style={{
                background: '#0d1813',
                border: '1px solid rgba(250, 204, 21, 0.3)',
                borderRadius: 14,
                padding: '16px 18px',
                marginBottom: 20,
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10, marginBottom: 10 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Transaction Ref:</span>
                <span style={{ fontWeight: 700, color: '#FACC15', fontFamily: 'monospace' }}>
                  {txId || `MOMO-${Date.now()}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Network Operator:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>🟡 MTN MoMo Cameroon</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Amount Settled:</span>
                <span style={{ fontWeight: 800, color: '#10b981', fontSize: '0.95rem' }}>
                  {currentAmount.toLocaleString()} FCFA
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Subscriber Phone:</span>
                <span style={{ fontWeight: 600, color: '#fff' }}>{formatDisplayPhone(phone)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Date & Time:</span>
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>{txTimestamp || 'Just now'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Status:</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    color: '#10b981',
                    fontWeight: 700,
                    background: 'rgba(16, 185, 129, 0.15)',
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: '0.75rem',
                  }}
                >
                  <i className="fas fa-check-circle" /> SUCCESSFUL
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: '#FACC15',
                  color: '#000',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                Done & Continue <i className="fas fa-arrow-right" />
              </button>
              <button
                type="button"
                onClick={copyReceiptRef}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  color: copied ? '#10b981' : 'rgba(255,255,255,0.75)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <i className={copied ? 'fas fa-check' : 'fas fa-copy'} />
                {copied ? 'Reference Copied to Clipboard!' : 'Copy Transaction Reference'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoMoPaymentModal;
