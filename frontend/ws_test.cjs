const { io } = require('socket.io-client');
const axios = require('axios');

async function runTest() {
  const baseURL = 'http://gateway';

  // Step 1: Login to get a token
  console.log('Logging in...');
  const loginRes = await axios.post(`${baseURL}/auth/login`, {
    username: 'tenant_admin',
    password: 'password123',
    tenant_id: 'demostore'
  });
  const token = loginRes.data.access_token;
  console.log('Login successful! Token:', token.substring(0, 40) + '...');

  // Step 2: Connect WebSocket through the Nginx gateway proxy
  console.log('\nConnecting WebSocket via gateway (/catalog/socket.io)...');
  const socket = io('http://gateway', {
    path: '/catalog/socket.io',
    transports: ['websocket'],
    auth: { token },
    reconnection: false
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('WebSocket connection timeout after 5s'));
    }, 5000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      console.log('✅ WebSocket connected! Socket ID:', socket.id);
      resolve();
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`WebSocket connection failed: ${err.message}`));
    });
  });

  // Step 3: Listen for stock_updated event
  console.log('\nListening for real-time stock_updated events...');
  const stockUpdatePromise = new Promise((resolve) => {
    socket.on('stock_updated', (data) => {
      console.log('📡 Received real-time event: stock_updated =>', JSON.stringify(data));
      resolve(data);
    });
  });

  // Step 4: Trigger a stock adjustment via API
  const headers = { Authorization: `Bearer ${token}` };
  const productsRes = await axios.get(`${baseURL}/catalog/products?page=1&limit=5`, { headers });
  const testProduct = productsRes.data.data[0];
  console.log(`\nAdjusting stock for product "${testProduct.name}" (ID: ${testProduct.id}) by +1...`);

  await axios.post(`${baseURL}/catalog/inventory/adjust`, {
    product_id: testProduct.id,
    quantity_change: 1
  }, { headers });

  // Step 5: Wait for real-time event (max 3 seconds)
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('No real-time event received within 3s')), 3000)
  );

  try {
    const event = await Promise.race([stockUpdatePromise, timeout]);
    console.log('\n✅ WEBSOCKET REAL-TIME UPDATES WORK!');
    console.log(`   Product ${event.productId} stock broadcast as: ${event.stockQuantity}`);
  } catch (err) {
    console.log('\n❌', err.message);
  }

  socket.disconnect();
  console.log('\nDone.');
  process.exit(0);
}

runTest().catch(err => {
  console.error('Test error:', err.message);
  process.exit(1);
});
