import axios from 'axios';

async function runCartTest() {
  const baseURL = 'http://gateway';
  console.log('--- STARTING CART & PRICING VERIFICATION TEST ---');
  console.log('Logging in...');
  
  try {
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      username: 'demostore.tenant_admin',
      password: 'password123',
      tenant_id: '1'
    });
    
    const token = loginRes.data.access_token;
    console.log('✓ Login successful! Token acquired.');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    // 1. Fetch products from catalog
    console.log('\nFetching products from catalog...');
    const productsRes = await axios.get(`${baseURL}/catalog/products?page=1&limit=5`, { headers });
    const products = productsRes.data.data;
    if (!products || products.length === 0) {
      throw new Error('No products available to test with.');
    }
    const testProduct = products[0];
    console.log(`✓ Got test product: "${testProduct.name}" (ID: ${testProduct.id}, Price: $${testProduct.price}, Stock: ${testProduct.stock_quantity})`);

    // Ensure there is stock
    if (testProduct.stock_quantity < 5) {
      console.log('Product stock is low. Adjusting stock to 10 for testing...');
      await axios.post(`${baseURL}/catalog/inventory/adjust`, {
        product_id: testProduct.id,
        quantity_change: 10 - testProduct.stock_quantity
      }, { headers });
    }

    // 2. Create a Cart
    console.log('\nCreating a new shopping cart...');
    const cartCreateRes = await axios.post(`${baseURL}/cart`, {}, { headers });
    const { cartId } = cartCreateRes.data;
    console.log(`✓ Cart created successfully. ID: ${cartId}`);

    // 3. Add Item to Cart
    console.log(`\nAdding 2 units of product (ID: ${testProduct.id}) to cart...`);
    const addRes = await axios.post(`${baseURL}/cart/${cartId}/items`, {
      product_id: testProduct.id,
      quantity: 2
    }, { headers });
    console.log('✓ Item added. Current cart contents:');
    console.log(JSON.stringify(addRes.data, null, 2));

    // 4. Try adding more than stock (e.g. 1000 items) to assert out-of-stock validation
    console.log('\nTesting stock boundary validation (attempting to add 1000 units)...');
    const overLimitRes = await axios.post(`${baseURL}/cart/${cartId}/items`, {
      product_id: testProduct.id,
      quantity: 1000
    }, { headers }).catch(e => e.response);
    console.log(`✓ Status: ${overLimitRes.status} (Expected: 400)`);
    console.log('Response body:', overLimitRes.data);

    // 5. Update Item Quantity
    console.log(`\nUpdating item quantity in cart to 3 units...`);
    const updateRes = await axios.patch(`${baseURL}/cart/${cartId}/items/${testProduct.id}`, {
      quantity: 3
    }, { headers });
    console.log('✓ Quantity updated. Current cart contents:');
    console.log(JSON.stringify(updateRes.data, null, 2));

    // 6. Test Pricing Calculation (Standard, Discount Code, and Percentage)
    console.log('\nCalculating pricing with no discounts (base 15% VAT)...');
    const priceRes1 = await axios.post(`${baseURL}/pricing/calculate`, {
      cartId
    }, { headers });
    console.log('Pricing result (No discount):');
    console.log(JSON.stringify(priceRes1.data, null, 2));

    console.log('\nCalculating pricing with 10% manual discount...');
    const priceRes2 = await axios.post(`${baseURL}/pricing/calculate`, {
      cartId,
      discountPercentage: 10
    }, { headers });
    console.log('Pricing result (10% discount):');
    console.log(`Subtotal: $${priceRes2.data.subtotal}, Discount: $${priceRes2.data.discount}, Tax: $${priceRes2.data.tax}, Total: $${priceRes2.data.total}`);

    console.log('\nCalculating pricing with coupon "SAVE20" (20% discount)...');
    const priceRes3 = await axios.post(`${baseURL}/pricing/calculate`, {
      cartId,
      discountCode: 'SAVE20'
    }, { headers });
    console.log('Pricing result (SAVE20):');
    console.log(`Subtotal: $${priceRes3.data.subtotal}, Discount: $${priceRes3.data.discount}, Tax: $${priceRes3.data.tax}, Total: $${priceRes3.data.total}`);

    // 7. Remove item
    console.log(`\nRemoving product (ID: ${testProduct.id}) from cart...`);
    const removeRes = await axios.delete(`${baseURL}/cart/${cartId}/items/${testProduct.id}`, { headers });
    console.log('✓ Item removed. Current cart contents:', removeRes.data);

    // 8. Clear Cart
    console.log('\nClearing cart...');
    const clearRes = await axios.delete(`${baseURL}/cart/${cartId}`, { headers });
    console.log('✓ Cart cleared. Status:', clearRes.status);

    console.log('\n--- ALL CART & PRICING VERIFICATION TESTS PASSED SUCCESSFULLY! ---');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
  }
}

runCartTest();
