// =============================================================
// MTN MoMo Simulation Engine — AfroRythm Platform
// =============================================================

// Small DOM safety helpers
function $e(id) { return document.getElementById(id); }
function safeDisplay(id, val) { const el = $e(id); if (el) el.style.display = val; }
function safeText(id, val) { const el = $e(id); if (el) el.textContent = val; }
function safeValue(id, val) { const el = $e(id); if (el) el.value = val; }
function safeMax(id, val) { const el = $e(id); if (el) el.max = val; }
function safeOnInput(id, handler) { const el = $e(id); if (el) el.oninput = handler; }

/**
 * Called by "Withdraw via MTN MoMo" button on the Revenue page.
 * Reads the chosen amount from the inline input and opens the MoMo withdrawal modal.
 */
window.handleWithdrawClick = function () {
    const amountInput = $e('withdrawAmount');
    const amount = parseFloat(amountInput ? amountInput.value : 0) || 0;
    // Pass available balance from mockData if accessible
    const available = (window.mockData && window.mockData.stats && window.mockData.stats.availableForWithdrawal)
        ? parseFloat(String(window.mockData.stats.availableForWithdrawal).replace(/[^0-9.]/g, '')) || 9999
        : 9999;
    // Pre-fill the amount in the MoMo modal
    window.openMomoWithdrawModal(available);
    // After modal opens, pre-set the amount
    setTimeout(() => {
        const momoAmountInput = $e('momoWithdrawAmount');
        if (momoAmountInput && amount > 0) {
            momoAmountInput.value = amount;
            momoAmountInput.dispatchEvent(new Event('input'));
        }
    }, 300);
};


/**
 * Open the MoMo subscription modal and populate with plan details.
 */
window.openMomoSubscribeModal = function (planName, priceAmount) {
    safeDisplay('momoSubInputSection', 'block');
    safeDisplay('momoSubProcessing', 'none');
    safeDisplay('momoSubSuccess', 'none');
    safeDisplay('momoSubFooter', 'block');
    safeValue('momoSubPhone', '');

    safeText('momoSubAmount', priceAmount === 0 ? 'FREE' : Number(priceAmount).toLocaleString() + ' FCFA/mo');
    safeText('momoSubPlanName', planName + ' Plan');

    window._momoPlan = { name: planName, price: priceAmount };

    const modalEl = $e('momoSubscribeModal');
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
};

/**
 * Open the MoMo withdrawal modal.
 */
window.openMomoWithdrawModal = function (availableAmount) {
    safeDisplay('momoWithdrawInputSection', 'block');
    safeDisplay('momoWithdrawProcessing', 'none');
    safeDisplay('momoWithdrawSuccess', 'none');
    safeDisplay('momoWithdrawFooter', 'block');
    safeValue('momoWithdrawPhone', '');
    safeValue('momoWithdrawAmount', '');
    safeText('momoFeeBase', '0 FCFA');
    safeText('momoFeeCharge', '— FCFA');
    safeText('momoFeeNet', '0 FCFA');

    window._momoAvailable = availableAmount || 0;

    const amountInput = $e('momoWithdrawAmount');
    if (amountInput) {
        amountInput.max = Math.min(10000, availableAmount);
        amountInput.oninput = function () {
            const val = parseFloat(this.value) || 0;
            const fee = Math.round(val * 0.02);
            const net = val - fee;
            safeText('momoFeeBase', val.toLocaleString() + ' FCFA');
            safeText('momoFeeCharge', '- ' + fee.toLocaleString() + ' FCFA');
            safeText('momoFeeNet', (net > 0 ? net : 0).toLocaleString() + ' FCFA');
        };
    }

    const modalEl = $e('momoWithdrawModal');
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
};

/**
 * Open the MoMo update account modal.
 */
window.openMomoUpdateAccountModal = function () {
    safeDisplay('momoUpdateInputSection', 'block');
    safeDisplay('momoUpdateProcessing', 'none');
    safeDisplay('momoUpdateSuccess', 'none');
    safeDisplay('momoUpdateFooter', 'block');
    safeValue('momoUpdatePhone', '');

    const modalEl = $e('momoUpdateAccountModal');
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
};
window.openUpdatePaymentFromModal = window.openMomoUpdateAccountModal;

/**
 * Subscription payment simulation flow.
 */
window.initiateMomoSubscription = function () {
    const phone = ($e('momoSubPhone') && $e('momoSubPhone').value) ? $e('momoSubPhone').value.trim() : '';
    const plan = window._momoPlan || {};

    if (!phone || phone.length < 9 || !phone.startsWith('6')) {
        const input = $e('momoSubPhone');
        if (input) {
            input.style.boxShadow = '0 0 0 3px rgba(255,55,95,0.4)';
            input.placeholder = (typeof t === 'function') ? t('Invalid number! Use format 6XXXXXXXX') : 'Invalid number! Use format 6XXXXXXXX';
            setTimeout(() => { input.style.boxShadow = ''; input.placeholder = '6XX XXX XXX'; }, 2000);
        }
        return;
    }

    const formatted = `+237 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;

    safeDisplay('momoSubInputSection', 'none');
    safeDisplay('momoSubFooter', 'none');
    safeDisplay('momoSubProcessing', 'block');

    const _t = (typeof t === 'function') ? t : (s) => s;
    const steps = [
        { title: _t('Sending payment prompt...'), msg: `${_t('A MoMo request has been sent to')||'A MoMo request has been sent to'} ${formatted}.` },
        { title: _t('Waiting for PIN confirmation...'), msg: _t('Please enter your MoMo PIN on your phone when prompted.') },
        { title: _t('Verifying with MTN network...'), msg: _t('Confirming your payment. Please do not close this window.') },
        { title: _t('Activating subscription...'), msg: `${_t('Payment confirmed! Activating your')||'Payment confirmed! Activating your'} ${plan.name} ${_t('plan')||'plan'}...` },
    ];

    runMomoSteps(
        steps,
        $e('momoSubStatusTitle'),
        $e('momoSubStatusMsg'),
        async () => {
            try {
                // Get current user ID
                const sessionRes = await fetch('backend/api/session.php');
                const session = await sessionRes.json();
                
                if (!session.success || !session.data.user) {
                    throw new Error("User session not found");
                }
                
                const userId = session.data.user.id;
                const startDate = new Date().toISOString().split('T')[0];
                const endDate = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0];
                
                // Create subscription record
                const subRes = await fetch('backend/api/subscriptions.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: userId,
                        plan_name: plan.name,
                        amount: plan.price,
                        status: 'active',
                        start_date: startDate,
                        end_date: endDate
                    })
                });
                
                const subJson = await subRes.json();
                if (!subJson.success) throw new Error(subJson.message);

                safeDisplay('momoSubProcessing', 'none');
                safeDisplay('momoSubSuccess', 'block');
                safeText('momoSubSuccessMsg',
                    plan.price === 0
                        ? `Your ${plan.name} plan is now active. Enjoy AfroRythm for free!`
                        : `${Number(plan.price).toLocaleString()} FCFA was charged to ${formatted}. Your ${plan.name} plan is active.`
                );
                
                if (typeof showNotification === 'function')
                    showNotification(`${plan.name} ${(typeof t === 'function' ? t('plan activated via MoMo!') : 'plan activated via MoMo!')} 🎉`, 'success');

                // Reload page after a short delay to reflect changes
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } catch (err) {
                console.error("Subscription Error:", err);
                if (typeof showNotification === 'function')
                    showNotification((typeof t === 'function' ? t('Subscription failed') : 'Subscription failed') + ': ' + err.message, 'danger');
                safeDisplay('momoSubProcessing', 'none');
                safeDisplay('momoSubInputSection', 'block');
                safeDisplay('momoSubFooter', 'block');
            }
        }
    );
};

/**
 * Withdrawal simulation flow.
 */
window.initiateMomoWithdrawal = function () {
    const phone = ($e('momoWithdrawPhone') && $e('momoWithdrawPhone').value) ? $e('momoWithdrawPhone').value.trim() : '';
    const amount = parseFloat($e('momoWithdrawAmount') ? $e('momoWithdrawAmount').value : 0);
    const available = window._momoAvailable || 0;

    if (!phone || phone.length < 9 || !phone.startsWith('6')) {
        const input = $e('momoWithdrawPhone');
        if (input) {
            input.style.boxShadow = '0 0 0 3px rgba(255,55,95,0.4)';
            setTimeout(() => input.style.boxShadow = '', 2000);
        }
        return;
    }

    if (!amount || amount < 5000) {
        const input = $e('momoWithdrawAmount');
        if (input) {
            input.style.boxShadow = '0 0 0 3px rgba(255,55,95,0.4)';
        }
        if (typeof showNotification === 'function')
            showNotification((typeof t === 'function') ? t('Minimum withdrawal is 5,000 FCFA') : 'Minimum withdrawal is 5,000 FCFA', 'danger');
        setTimeout(() => { const inEl = $e('momoWithdrawAmount'); if (inEl) inEl.style.boxShadow = ''; }, 2000);
        return;
    }

    if (amount > Math.min(10000, available)) {
        if (typeof showNotification === 'function')
            showNotification((typeof t === 'function') ? t('Amount exceeds daily limit (10,000 FCFA) or available balance.') : 'Amount exceeds daily limit (10,000 FCFA) or available balance.', 'danger');
        return;
    }

    const formatted = `+237 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
    const fee = Math.round(amount * 0.02);
    const net = amount - fee;

    safeDisplay('momoWithdrawInputSection', 'none');
    safeDisplay('momoWithdrawFooter', 'none');
    safeDisplay('momoWithdrawProcessing', 'block');

    const _t2 = (typeof t === 'function') ? t : (s) => s;
    const steps = [
        { title: _t2('Initiating transfer...'), msg: _t2('Connecting to MTN MoMo network...') },
        { title: _t2('Processing payment...'), msg: `${_t2('Transferring')||'Transferring'} ${net.toLocaleString()} FCFA ${_t2('to')||'to'} ${formatted}...` },
        { title: _t2('Waiting for MTN confirmation...'), msg: _t2('Network verification in progress. This may take a moment.') },
        { title: _t2('Transfer complete!'), msg: _t2('Updating your earnings balance...') },
    ];

    runMomoSteps(
        steps,
        $e('momoWithdrawStatusTitle'),
        $e('momoWithdrawStatusMsg'),
        async () => {
            try {
                const drawRes = await fetch('backend/api/withdrawals.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount, phone_number: phone })
                });
                
                const drawData = await drawRes.json();
                
                if (drawData.success) {
                    safeDisplay('momoWithdrawProcessing', 'none');
                    safeDisplay('momoWithdrawSuccess', 'block');
                    safeText('momoWithdrawSuccessMsg', `${net.toLocaleString()} FCFA sent to ${formatted}. Processing fee: ${fee.toLocaleString()} FCFA.`);
                    
                    if (window._momoAvailable) {
                        window._momoAvailable -= amount;
                        // Attempt to update the main UI displays if they exist
                        const availableEarningsDisplay = $e('availableEarningsDisplay');
                        if (availableEarningsDisplay) availableEarningsDisplay.textContent = window._momoAvailable.toLocaleString() + ' FCFA';
                        const wAvail = $e('withdrawAvailable');
                        if (wAvail) wAvail.textContent = window._momoAvailable.toLocaleString() + ' FCFA';
                    }

                    if (typeof showNotification === 'function')
                        showNotification(`${net.toLocaleString()} FCFA ${(typeof t === 'function' ? t('transferred to MoMo!') : 'transferred to MoMo!')} 💸`, 'success');
                } else {
                    safeDisplay('momoWithdrawProcessing', 'none');
                    safeDisplay('momoWithdrawInputSection', 'block');
                    safeDisplay('momoWithdrawFooter', 'block');
                    if (typeof showNotification === 'function')
                        showNotification((typeof t === 'function' ? t('Withdrawal failed') : 'Withdrawal failed') || (drawData.message), 'danger');
                }
            } catch (err) {
                console.error(err);
                safeDisplay('momoWithdrawProcessing', 'none');
                safeDisplay('momoWithdrawInputSection', 'block');
                safeDisplay('momoWithdrawFooter', 'block');
                if (typeof showNotification === 'function')
                    showNotification((typeof t === 'function') ? t('Network error during withdrawal') : 'Network error during withdrawal', 'danger');
            }
        }
    );
};

/**
 * Update MoMo account simulation flow.
 */
window.initiateMomoUpdate = function () {
    const phone = document.getElementById('momoUpdatePhone').value.trim();

    if (!phone || phone.length < 9 || !phone.startsWith('6')) {
        const input = document.getElementById('momoUpdatePhone');
        input.style.boxShadow = '0 0 0 3px rgba(255,55,95,0.4)';
        setTimeout(() => input.style.boxShadow = '', 2000);
        return;
    }

    const formatted = `+237 ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;

    document.getElementById('momoUpdateInputSection').style.display = 'none';
    document.getElementById('momoUpdateFooter').style.display = 'none';
    document.getElementById('momoUpdateProcessing').style.display = 'block';

    // Simulate update delay
    setTimeout(() => {
        document.getElementById('momoUpdateProcessing').style.display = 'none';
        document.getElementById('momoUpdateSuccess').style.display = 'block';
        document.getElementById('momoUpdateSuccessMsg').textContent = 
            `Your payment account has been updated to ${formatted}. Future transactions will use this number.`;
        
        // Update UI displays
        const displays = ['momoNumberDisplay', 'momoNumberManageDisplay'];
        displays.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = `MTN MoMo: ${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
        });

        if (typeof showNotification === 'function')
            showNotification((typeof t === 'function') ? t('MoMo account updated successfully!') + ' 🎉' : 'MoMo account updated successfully! 🎉', 'success');
    }, 2500);
};

/**
 * Utility: cycle through MoMo steps then call onDone.
 */
function runMomoSteps(steps, titleEl, msgEl, onDone) {
    let i = 0;
    const interval = setInterval(() => {
        if (i < steps.length) {
            titleEl.textContent = steps[i].title;
            msgEl.textContent = steps[i].msg;
            i++;
        } else {
            clearInterval(interval);
            onDone();
        }
    }, 1400);
}

/**
 * Close & reset a MoMo modal.
 */
window.closeMomoModal = function (modalId) {
    const modalEl = document.getElementById(modalId);
    const instance = bootstrap.Modal.getInstance(modalEl);
    if (instance) instance.hide();

    modalEl.addEventListener('hidden.bs.modal', function resetOnClose() {
        if (modalId === 'momoSubscribeModal') {
            document.getElementById('momoSubProcessing').style.display = 'none';
            document.getElementById('momoSubSuccess').style.display = 'none';
            document.getElementById('momoSubFooter').style.display = 'block';
        } else if (modalId === 'momoUpdateAccountModal') {
            document.getElementById('momoUpdateInputSection').style.display = 'block';
            document.getElementById('momoUpdateProcessing').style.display = 'none';
            document.getElementById('momoUpdateSuccess').style.display = 'none';
            document.getElementById('momoUpdateFooter').style.display = 'block';
        } else {
            document.getElementById('momoWithdrawInputSection').style.display = 'block';
            document.getElementById('momoWithdrawProcessing').style.display = 'none';
            document.getElementById('momoWithdrawSuccess').style.display = 'none';
            document.getElementById('momoWithdrawFooter').style.display = 'block';
        }
        modalEl.removeEventListener('hidden.bs.modal', resetOnClose);
    });
};
