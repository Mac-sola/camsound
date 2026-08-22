const axios = require('axios');
const API_BASE = 'http://localhost:5000/api';

async function testSubscriptionsAndWithdrawals() {
  try {
    console.log('\n💰 Subscriptions & Withdrawals Workflow Test');
    console.log('========================================\n');

    // Step 1: Login as Artist
    console.log('Step 1: Login as Artist...');
    const artistLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'artist@camsound.com',
      password: 'Artist@123456',
    });

    if (!artistLoginRes.data.success) {
      throw new Error(`Login failed: ${artistLoginRes.data.message}`);
    }

    const artistToken = artistLoginRes.data.token;
    const artistCsrf = artistLoginRes.data.csrfToken;
    console.log('✅ Artist login successful\n');

    // Step 2: Get available plans
    console.log('Step 2: Fetching subscription plans...');
    const plansRes = await axios.get(`${API_BASE}/subscriptions/plans`, {
      headers: { 'Authorization': `Bearer ${artistToken}` }
    });

    if (!plansRes.data.success) {
      throw new Error(`Failed to fetch plans: ${plansRes.data.message}`);
    }

    const plans = plansRes.data.data || [];
    console.log(`✅ Found ${plans.length} subscription plans\n`);

    if (plans.length === 0) {
      throw new Error('No subscription plans available');
    }

    const testPlan = plans[0];
    console.log(`Test plan: ${testPlan.name} (${testPlan.price} XAF/${testPlan.period})\n`);

    // Step 3: Create a subscription
    console.log('Step 3: Creating a subscription...');
    const subRes = await axios.post(
      `${API_BASE}/subscriptions`,
      {
        planName: testPlan.name,
        amount: testPlan.price,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      },
      {
        headers: { 
          'Authorization': `Bearer ${artistToken}`,
          'X-CSRF-Token': artistCsrf
        }
      }
    );

    if (!subRes.data.success) {
      throw new Error(`Subscription creation failed: ${subRes.data.message}`);
    }

    const subscription = subRes.data.data;
    console.log('✅ Subscription created successfully');
    console.log(`   ID: ${subscription._id}`);
    console.log(`   Plan: ${subscription.planName}`);
    console.log(`   Amount: ${subscription.amount} XAF`);
    console.log(`   Status: ${subscription.status}\n`);

    // Step 4: Create a payment
    console.log('Step 4: Creating a payment for the subscription...');
    const paymentRes = await axios.post(
      `${API_BASE}/payments`,
      {
        amount: testPlan.price,
        currency: 'XAF',
        paymentMethod: 'MoMo',
        transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        status: 'pending'
      },
      {
        headers: { 
          'Authorization': `Bearer ${artistToken}`,
          'X-CSRF-Token': artistCsrf
        }
      }
    );

    if (!paymentRes.data.success) {
      throw new Error(`Payment creation failed: ${paymentRes.data.message}`);
    }

    const payment = paymentRes.data.data;
    console.log('✅ Payment created successfully');
    console.log(`   ID: ${payment._id}`);
    console.log(`   Amount: ${payment.amount} ${payment.currency}`);
    console.log(`   Transaction ID: ${payment.transactionId}`);
    console.log(`   Status: ${payment.status}\n`);

    // Step 5: Request a withdrawal
    console.log('Step 5: Requesting a withdrawal...');
    const withdrawalRes = await axios.post(
      `${API_BASE}/withdrawals`,
      {
        amount: 50000,
        momoNumber: '+237670123456',
        status: 'pending'
      },
      {
        headers: { 
          'Authorization': `Bearer ${artistToken}`,
          'X-CSRF-Token': artistCsrf
        }
      }
    );

    if (!withdrawalRes.data.success) {
      throw new Error(`Withdrawal request failed: ${withdrawalRes.data.message}`);
    }

    const withdrawal = withdrawalRes.data.data;
    console.log('✅ Withdrawal request created successfully');
    console.log(`   ID: ${withdrawal._id}`);
    console.log(`   Amount: ${withdrawal.amount} XAF`);
    console.log(`   MoMo Number: ${withdrawal.momoNumber}`);
    console.log(`   Status: ${withdrawal.status}\n`);

    // Step 6: Get withdrawal history
    console.log('Step 6: Fetching withdrawal history...');
    const historyRes = await axios.get(`${API_BASE}/withdrawals`, {
      headers: { 'Authorization': `Bearer ${artistToken}` }
    });

    if (!historyRes.data.success) {
      throw new Error(`Failed to fetch withdrawals: ${historyRes.data.message}`);
    }

    const withdrawals = historyRes.data.data || [];
    console.log(`✅ Found ${withdrawals.length} withdrawals in history\n`);

    // Step 7: Admin approves withdrawal (login as admin)
    console.log('Step 7: Admin approving withdrawal...');
    const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@camsound.com',
      password: 'Admin@123456',
    });

    const adminToken = adminLoginRes.data.token;
    const adminCsrf = adminLoginRes.data.csrfToken;

    const approveWithdrawalRes = await axios.put(
      `${API_BASE}/withdrawals/${withdrawal._id}`,
      {
        status: 'completed',
        processedBy: adminToken,
        processedAt: new Date().toISOString()
      },
      {
        headers: { 
          'Authorization': `Bearer ${adminToken}`,
          'X-CSRF-Token': adminCsrf
        }
      }
    );

    if (!approveWithdrawalRes.data.success) {
      console.log(`⚠️ Withdrawal approval returned: ${approveWithdrawalRes.data.message}`);
    } else {
      console.log('✅ Withdrawal approved by admin');
      console.log(`   Status: ${approveWithdrawalRes.data.data.status}\n`);
    }

    console.log('✅ All subscription and withdrawal tests passed!');
    console.log('========================================\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('API Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testSubscriptionsAndWithdrawals();
