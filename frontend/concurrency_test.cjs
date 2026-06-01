const axios = require('axios');

async function runTest() {
  const baseURL = 'http://gateway';
  console.log('Logging in...');
  
  try {
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      username: 'tenant_admin',
      password: 'password123',
      tenant_id: 'demostore'
    });
    
    const token = loginRes.data.access_token;
    console.log('Login successful! Token acquired.');

    const headers = { Authorization: `Bearer ${token}` };

    // Get current products
    const productsRes = await axios.get(`${baseURL}/catalog/products?page=1&limit=5`, { headers });
    const products = productsRes.data.data;
    
    if (!products || products.length === 0) {
      console.log('No products found to test.');
      return;
    }

    const testProduct = products[0];
    console.log(`Testing product: "${testProduct.name}" (ID: ${testProduct.id}), current stock: ${testProduct.stock_quantity}`);

    // Set stock to exactly 1 so we can prove overselling is blocked
    console.log('Setting stock to exactly 1...');
    const diff = 1 - testProduct.stock_quantity;
    await axios.post(`${baseURL}/catalog/inventory/adjust`, {
      product_id: testProduct.id,
      quantity_change: diff
    }, { headers });

    // Verify stock is 1
    const verifyRes = await axios.get(`${baseURL}/catalog/products/${testProduct.id}`, { headers });
    console.log(`Verified initial stock: ${verifyRes.data.stock_quantity}`);

    // Fire two concurrent requests to sell 1 unit each — only one should succeed
    console.log('\nFiring 2 simultaneous sale requests for 1 unit each...');
    const req1 = axios.post(`${baseURL}/catalog/inventory/adjust`, {
      product_id: testProduct.id,
      quantity_change: -1
    }, { headers }).then(r => r).catch(e => e.response);

    const req2 = axios.post(`${baseURL}/catalog/inventory/adjust`, {
      product_id: testProduct.id,
      quantity_change: -1
    }, { headers }).then(r => r).catch(e => e.response);

    const [res1, res2] = await Promise.all([req1, req2]);

    console.log('\n--- Request 1 ---');
    console.log('Status:', res1.status);
    if (res1.status === 200) console.log('stock_quantity:', res1.data.stock_quantity);
    else console.log('Error:', res1.data?.message);

    console.log('\n--- Request 2 ---');
    console.log('Status:', res2.status);
    if (res2.status === 200) console.log('stock_quantity:', res2.data.stock_quantity);
    else console.log('Error:', res2.data?.message);

    // Get final stock
    const finalRes = await axios.get(`${baseURL}/catalog/products/${testProduct.id}`, { headers });
    const finalStock = finalRes.data.stock_quantity;
    console.log(`\nFinal stock: ${finalStock}`);

    if (finalStock === 0) {
      console.log('\n✅ PESSIMISTIC LOCKING WORKS: Exactly 1 unit sold, stock is 0. No overselling!');
    } else if (finalStock < 0) {
      console.log('\n❌ FAIL: Stock went below 0 — race condition occurred!');
    } else {
      console.log('\n⚠️  Unexpected stock level. Both requests may have been blocked or both succeeded.');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) console.error('Error response:', error.response.data);
  }
}

runTest();
