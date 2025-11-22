/**
 * Test Requests for Timescape Intermediate Example
 * 
 * This script demonstrates:
 * 1. Breaking changes (price string → priceInCents number)
 * 2. Multi-hop transformer chains (V1 → V2 → V3)
 * 3. Type conversions
 * 4. Database schema migrations
 */

const BASE_URL = 'http://localhost:3000';

async function makeRequest(path, version, description) {
  const url = version ? `${BASE_URL}${path}?version=${version}` : `${BASE_URL}${path}`;
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Test: ${description}`);
  console.log(`Request: GET ${path}`);
  console.log(`Version: ${version || 'latest'}`);
  console.log(`${'='.repeat(70)}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    // Analyze response structure
    if (Array.isArray(data) && data.length > 0) {
      const product = data[0];
      console.log('\nResponse Structure:');
      
      if ('price' in product) {
        console.log('  ✓ Has "price" field (string):', typeof product.price === 'string' ? 'YES' : 'NO');
        console.log('  ✓ Format: V1');
      }
      
      if ('priceInCents' in product) {
        console.log('  ✓ Has "priceInCents" field (number):', typeof product.priceInCents === 'number' ? 'YES' : 'NO');
        console.log('  ✓ Format: V2+');
      }
      
      if ('currency' in product) {
        console.log('  ✓ Has "currency" field:', 'YES');
        console.log('  ✓ Format: V3');
      }
      
      if ('inStock' in product) {
        console.log('  ✓ Has "inStock" field:', 'YES');
        console.log('  ✓ Format: V3');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Timescape Intermediate Example - Test Requests');
  console.log('E-commerce API with Breaking Changes');
  console.log('='.repeat(70));
  
  // ========================================
  // Test Group 1: Version-specific requests
  // ========================================
  
  await makeRequest(
    '/products',
    'v1.0.0',
    'V1 Request - String price format'
  );
  
  await makeRequest(
    '/products',
    'v2.0.0',
    'V2 Request - Integer priceInCents format (BREAKING CHANGE)'
  );
  
  await makeRequest(
    '/products',
    'v3.0.0',
    'V3 Request - With currency and stock info'
  );
  
  // ========================================
  // Test Group 2: Timestamp-based requests
  // ========================================
  
  await makeRequest(
    '/products',
    '2025-11-20T12:00:00Z',
    'Timestamp Request - V1 era (before breaking change)'
  );
  
  await makeRequest(
    '/products',
    '2025-11-21T12:00:00Z',
    'Timestamp Request - V2 era (after breaking change)'
  );
  
  await makeRequest(
    '/products',
    '2025-11-22T12:00:00Z',
    'Timestamp Request - V3 era (with currency)'
  );
  
  // ========================================
  // Test Group 3: Direct TSV requests
  // ========================================
  
  await makeRequest(
    '/products',
    'tsv:1732104000-products-001',
    'Direct TSV - V1 (string price)'
  );
  
  await makeRequest(
    '/products',
    'tsv:1732183200-products-002',
    'Direct TSV - V2 (integer priceInCents)'
  );
  
  await makeRequest(
    '/products',
    'tsv:1732269600-products-003',
    'Direct TSV - V3 (with currency and stock)'
  );
  
  // ========================================
  // Test Group 4: Multi-hop transformation
  // ========================================
  
  await makeRequest(
    '/products',
    'v1.0.0',
    'Multi-hop: V1 request → V3 handler → V1 response (2 hops)'
  );
  
  // ========================================
  // Test Group 5: Single product requests
  // ========================================
  
  await makeRequest(
    '/products/1',
    'v1.0.0',
    'Single Product - V1 format'
  );
  
  await makeRequest(
    '/products/1',
    'v2.0.0',
    'Single Product - V2 format'
  );
  
  await makeRequest(
    '/products/1',
    'v3.0.0',
    'Single Product - V3 format'
  );
  
  // ========================================
  // Test Group 6: Latest version (no version specified)
  // ========================================
  
  await makeRequest(
    '/products',
    null,
    'Latest Version - Should return V3 format'
  );
  
  // ========================================
  // Test Group 7: Price comparison across versions
  // ========================================
  
  console.log(`\n${'='.repeat(70)}`);
  console.log('Price Format Comparison');
  console.log(`${'='.repeat(70)}`);
  console.log('V1: price = "29.99" (string)');
  console.log('V2: priceInCents = 2999 (number)');
  console.log('V3: priceInCents = 2999, currency = "USD" (number + string)');
  console.log('\nTransformation:');
  console.log('  V1 → V2: "29.99" → 2999 (parseFloat + multiply by 100)');
  console.log('  V2 → V1: 2999 → "29.99" (divide by 100 + toFixed(2))');
  console.log('  V2 → V3: Add currency="USD", inStock=true (defaults)');
  console.log('  V3 → V2: Remove currency and inStock fields');
  
  console.log(`\n${'='.repeat(70)}`);
  console.log('All tests completed!');
  console.log(`${'='.repeat(70)}\n`);
}

// Run tests
runTests().catch(console.error);
