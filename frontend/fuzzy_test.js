import { FuzzySearchIndex } from './src/utils/FuzzySearchIndex.js';

function runFuzzyTest() {
  console.log('--- Client-side Fuzzy Search Engine Benchmark ---');
  
  const index = new FuzzySearchIndex();

  // 1. Generate 10,000 mock products
  console.log('Generating 10,000 mock products...');
  const mockProducts = [];
  
  // Seed a few target products with specific names to search for
  mockProducts.push({ id: 1, name: 'Honor 600 Pro', sku: 'HON-600-PRO', barcode: '100000000001', sales_velocity: '2.5', stock_quantity: 50 });
  mockProducts.push({ id: 2, name: 'Apple iPhone 15 Pro Max', sku: 'AAPL-IPH-15', barcode: '100000000002', sales_velocity: '5.2', stock_quantity: 20 });
  mockProducts.push({ id: 3, name: 'Samsung Galaxy S24 Ultra', sku: 'SMS-S24-ULT', barcode: '100000000003', sales_velocity: '4.8', stock_quantity: 15 });
  mockProducts.push({ id: 4, name: 'Sony WH-1000XM5 Headphones', sku: 'SON-XM5-WHL', barcode: '100000000004', sales_velocity: '1.2', stock_quantity: 8 });

  for (let i = 5; i <= 10000; i++) {
    mockProducts.push({
      id: i,
      name: `Generic Product ${i} Brand`,
      sku: `SKU-GEN-${i}`,
      barcode: `10000000${String(i).padStart(4, '0')}`,
      sales_velocity: (Math.random() * 2).toFixed(2),
      stock_quantity: Math.floor(Math.random() * 100)
    });
  }

  // 2. Measure build/index time
  const t0 = performance.now();
  index.addProducts(mockProducts);
  const t1 = performance.now();
  console.log(`Successfully built Trie search index of 10,000 items in ${(t1 - t0).toFixed(2)} ms`);

  // 3. Test Cases for correctness
  const testCases = [
    {
      query: 'Hnor',
      expectedId: 1, // 'Honor 600 Pro' (distance 1 typo)
      description: 'Single distance-1 typo ("Hnor" -> "Honor")'
    },
    {
      query: 'iphn',
      expectedId: 2, // 'Apple iPhone 15 Pro Max' (distance 2 typo "iphn" -> "iphone")
      description: 'Double distance-2 typo ("iphn" -> "iphone")'
    },
    {
      query: 'Galxy',
      expectedId: 3, // 'Samsung Galaxy S24 Ultra'
      description: 'Single distance-1 typo ("Galxy" -> "Galaxy")'
    },
    {
      query: 'XM5',
      expectedId: 4, // 'Sony WH-1000XM5 Headphones' (SKU/name part matching)
      description: 'Exact sub-token match ("XM5" -> "1000XM5")'
    }
  ];

  console.log('\n--- Correctness Testing ---');
  let allPassed = true;
  for (const tc of testCases) {
    const start = performance.now();
    const results = index.search(tc.query);
    const end = performance.now();
    const duration = end - start;

    console.log(`Query: "${tc.query}" | ${tc.description}`);
    console.log(`- Results count: ${results.length}`);
    console.log(`- Top match: "${results[0]?.name || 'None'}" (ID: ${results[0]?.id || 'None'})`);
    console.log(`- Execution time: ${duration.toFixed(3)} ms`);

    const hasExpected = results.some(p => p.id === tc.expectedId);
    if (hasExpected && results[0]?.id === tc.expectedId) {
      console.log('-> PASS: Correct product found at rank 1.');
    } else if (hasExpected) {
      console.log('-> WARNING: Correct product found but not at rank 1.');
    } else {
      console.log('-> FAIL: Correct product NOT found.');
      allPassed = false;
    }
  }

  // 4. Performance Benchmark (1,000 random searches)
  console.log('\n--- Stress/Performance Benchmarking ---');
  const benchmarkQueries = [
    'hnor', 'iphn', 'samsng', 'headphn', 'wh1000', 'genric', 'brand', 'sku', 'product', '10000'
  ];
  
  const iterations = 1000;
  const startBench = performance.now();
  for (let i = 0; i < iterations; i++) {
    const q = benchmarkQueries[i % benchmarkQueries.length];
    index.search(q);
  }
  const endBench = performance.now();
  const totalBenchTime = endBench - startBench;
  const averageQueryTime = totalBenchTime / iterations;

  console.log(`Executed ${iterations} search queries consecutively.`);
  console.log(`Total time: ${totalBenchTime.toFixed(2)} ms`);
  console.log(`Average search query execution time: ${averageQueryTime.toFixed(3)} ms`);

  if (averageQueryTime < 10) {
    console.log(`\nSUCCESS: Target met! Average query execution time is under 10ms (Actual: ${averageQueryTime.toFixed(3)}ms).`);
  } else {
    console.log(`\nFAIL: Average query execution time exceeds 10ms (Actual: ${averageQueryTime.toFixed(3)}ms).`);
    allPassed = false;
  }

  if (allPassed) {
    console.log('Overall test status: ALL TESTS PASSED.');
  } else {
    console.log('Overall test status: SOME TESTS FAILED.');
    process.exit(1);
  }
}

runFuzzyTest();
