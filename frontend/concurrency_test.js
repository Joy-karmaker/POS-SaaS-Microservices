import axios from 'axios';

async function runTest() {
  const baseURL = 'http://gateway'; // We can use the Docker network upstream hostname!
  console.log('Logging in...');
  
  try {
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      username: 'demostore.tenant_admin',
      password: 'password123',
      tenant_id: '1'
    });
    
    const token = loginRes.data.access_token;
    console.log('Login successful! Token acquired.');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    // Get current products
    const productsRes = await axios.get(`${baseURL}/catalog/products?page=1&limit=5`, { headers });
    const products = productsRes.data.data;
    
    if (!products || products.length === 0) {
      console.log('No products found to test.');
      return;
    }

    const testProduct = products[0];
    console.log(`Testing product: "${testProduct.name}" (ID: ${testProduct.id}), current stock: ${testProduct.stock_quantity}`);

    // Set stock to 1 first so we can test overselling
    console.log('Setting stock to exactly 1...');
    const diff = 1 - testProduct.stock_quantity;
    await axios.post(`${baseURL}/catalog/inventory/adjust`, {
      product_id: testProduct.id,
      quantity_change: diff
    }, { headers });

    // Verify stock is 1
    const verifyRes = await axios.get(`${baseURL}/catalog/products/${testProduct.id}`, { headers });
    console.log(`Verified initial stock: ${verifyRes.data.stock_quantity}`);

    // Trigger concurrent requests to sell 1 unit
    console.log('Triggering 2 concurrent sales of 1 unit each...');
    const req1 = axios.post(`${baseURL}/catalog/inventory/adjust`, {
      product_id: testProduct.id,
      quantity_change: -1
    }, { headers }).catch(e => e.response);

    const req2 = axios.post(`${baseURL}/catalog/inventory/adjust`, {
      product_id: testProduct.id,
      quantity_change: -1
    }, { headers }).catch(e => e.response);

    const [res1, res2] = await Promise.all([req1, req2]);

    console.log('\n--- Request 1 Result ---');
    console.log('Status:', res1.status);
    console.log('Data:', res1.data);

    console.log('\n--- Request 2 Result ---');
    console.log('Status:', res2.status);
    console.log('Data:', res2.data);

    // Get final stock
    const finalRes = await axios.get(`${baseURL}/catalog/products/${testProduct.id}`, { headers });
    console.log(`\nFinal product stock: ${finalRes.data.stock_quantity}`);
    
    if (finalRes.data.stock_quantity >= 0) {
      console.log('SUCCESS: Stock level is consistent and never went below 0!');
    } else {
      console.log('FAIL: Stock level went below 0! Race condition occurred.');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
  }
}

runTest();
