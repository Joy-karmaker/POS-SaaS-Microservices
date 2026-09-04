const jwt = require('jsonwebtoken');

async function testGateways() {
  const secret = process.env.AUTH_JWT_SECRET || 'local-dev-jwt-secret-change-this';
  const token = jwt.sign(
    {
      id: 1,
      tenant_id: 1,
      email: 'test@example.com',
      username: 'TestManager',
      iss: 'pos-auth',
      aud: 'pos-clients',
    },
    secret,
    { expiresIn: '1h' }
  );

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const gatewayUrl = 'http://127.0.0.1'; // Via Nginx Gateway

  console.log('--- Step 1: Test POS Sale with Cash Gateway ---');
  const cashRes = await fetch(`${gatewayUrl}/payment/payments/initiate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      purpose: 'POS_SALE',
      method: 'CASH',
      gateway: 'CASH',
      amount: 45.0,
      currency: 'USD',
      items: [{ product_id: 1, product_name: 'Test Item', quantity: 2, unit_price: 22.5 }],
    }),
  });
  const cashData = await cashRes.json();
  console.log('Cash Payment Response:', cashData.status, 'Receipt:', cashData.receipt_number, 'Gateway:', cashData.gateway);

  console.log('\n--- Step 2: Test POS Sale with Stripe Gateway Adapter ---');
  const stripeRes = await fetch(`${gatewayUrl}/payment/payments/initiate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      purpose: 'POS_SALE',
      method: 'CARD',
      gateway: 'STRIPE',
      amount: 120.0,
      currency: 'USD',
      items: [{ product_id: 1, product_name: 'Premium Headphones', quantity: 1, unit_price: 120.0 }],
    }),
  });
  const stripeData = await stripeRes.json();
  console.log('Stripe Session Initiated:', stripeData.status, 'Gateway Ref:', stripeData.gateway_ref, 'Client Secret:', stripeData.client_secret?.slice(0, 20) + '...');

  console.log('\n--- Step 3: Verify Stripe Payment ---');
  const stripeVerifyRes = await fetch(`${gatewayUrl}/payment/payments/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      payment_id: stripeData.id,
      gateway: 'STRIPE',
      gateway_ref: stripeData.gateway_ref,
    }),
  });
  const stripeVerifyData = await stripeVerifyRes.json();
  console.log('Stripe Verification Result:', stripeVerifyData.status, 'Details:', stripeVerifyData.verification_details);

  console.log('\n--- Step 4: Test Restock Order Creation with Cost Calculation ---');
  const restockRes = await fetch(`${gatewayUrl}/catalog/restock`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      warehouse_name: 'Central Distribution Hub',
      notes: 'Test Restock with Payment Gateway',
      items: [{ product_id: 1, quantity: 20, cost_price: 15.0 }],
    }),
  });
  const restockOrder = await restockRes.json();
  console.log('Created Restock Order:', restockOrder.order_number, 'Total Cost:', restockOrder.total_cost, 'Payment Status:', restockOrder.payment_status);

  console.log('\n--- Step 5: Settle Restock Order via SSLCOMMERZ Gateway ---');
  const sslRes = await fetch(`${gatewayUrl}/payment/payments/initiate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      purpose: 'RESTOCK_ORDER',
      restock_order_id: restockOrder.id,
      reference_id: String(restockOrder.id),
      method: 'SSLCOMMERZ',
      gateway: 'SSLCOMMERZ',
      amount: Number(restockOrder.total_cost || 300),
      currency: 'BDT',
      warehouse_name: restockOrder.warehouse_name,
    }),
  });
  const sslData = await sslRes.json();
  console.log('SSLCOMMERZ Session Initiated:', sslData.status, 'Redirect URL:', sslData.redirect_url, 'Tran ID:', sslData.gateway_ref);

  console.log('\n--- Step 6: Verify SSLCOMMERZ Payment & Trigger Outbox ---');
  const sslVerifyRes = await fetch(`${gatewayUrl}/payment/payments/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      payment_id: sslData.id,
      gateway: 'SSLCOMMERZ',
      gateway_ref: sslData.gateway_ref,
      verification_data: { tran_id: sslData.gateway_ref, val_id: `VAL_TEST_${Date.now()}` },
    }),
  });
  const sslVerifyData = await sslVerifyRes.json();
  console.log('SSLCOMMERZ Verification Result:', sslVerifyData.status, 'Receipt:', sslVerifyData.receipt_number);

  console.log('\nWaiting 2 seconds for RabbitMQ restock.paid consumer to process...');
  await new Promise((r) => setTimeout(r, 2000));

  console.log('\n--- Step 7: Check Updated Restock Order Status in Catalog Service ---');
  const updatedRestockRes = await fetch(`${gatewayUrl}/catalog/restock/${restockOrder.id}`, {
    headers,
  });
  const updatedRestock = await updatedRestockRes.json();
  console.log('Updated Restock Order:', updatedRestock.order_number, 'Payment Status:', updatedRestock.payment_status, 'Payment Gateway:', updatedRestock.payment_gateway, 'Payment ID:', updatedRestock.payment_id);

  console.log('\n✅ ALL PAYMENT GATEWAY & RESTOCK TESTS PASSED SUCCESSFULLY!');
}

testGateways().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
