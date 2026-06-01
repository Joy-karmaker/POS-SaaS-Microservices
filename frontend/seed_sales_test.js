import axios from 'axios';

async function runSeedingTest() {
  const baseURL = 'http://gateway';
  console.log('Logging in to trigger seeding...');
  
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

    console.log('Triggering high-volume simulation of 1,000 sales...');
    const start = Date.now();
    const seedRes = await axios.post(`${baseURL}/catalog/analytics/seed-sales`, {
      count: 1000
    }, { headers });
    const end = Date.now();
    
    console.log('\n--- Seeding Result ---');
    console.log('Status:', seedRes.status);
    console.log('Data:', seedRes.data);
    console.log(`Time taken: ${((end - start) / 1000).toFixed(2)} seconds`);

    // Verify analytics summary
    console.log('\nFetching updated analytics KPIs...');
    const summaryRes = await axios.get(`${baseURL}/catalog/analytics/summary`, { headers });
    console.log('\n--- Analytics Summary KPIs ---');
    console.log(JSON.stringify(summaryRes.data, null, 2));

    // Verify forecast list (top 5 products)
    console.log('\nFetching top 5 products forecast list...');
    const forecastRes = await axios.get(`${baseURL}/catalog/analytics/forecast?page=1&limit=5`, { headers });
    console.log('\n--- Top 5 Product Forecasts ---');
    console.log(JSON.stringify(forecastRes.data.data.map(p => ({
      id: p.id,
      name: p.name,
      stock: p.stock_quantity,
      sales_velocity: p.sales_velocity,
      stock_out_date: p.stock_out_date
    })), null, 2));

    console.log('\nSUCCESS: Seeding simulation completed, KPIs generated and checked.');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
  }
}

runSeedingTest();
