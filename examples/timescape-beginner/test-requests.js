/**
 * Test Requests for Timescape Beginner Example
 * 
 * This script demonstrates different ways to request versioned APIs:
 * 1. Request with semantic version tag (v1.0.0)
 * 2. Request with semantic version tag (v1.1.0)
 * 3. Request with timestamp
 * 4. Request with direct TSV
 * 5. Request without version (latest)
 */

const BASE_URL = 'http://localhost:3000';

async function makeRequest(path, version) {
  const url = version ? `${BASE_URL}${path}?version=${version}` : `${BASE_URL}${path}`;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Request: GET ${path}`);
  console.log(`Version: ${version || 'latest'}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    // Check if author field is present
    if (Array.isArray(data) && data.length > 0) {
      const hasAuthor = 'author' in data[0];
      console.log(`Has 'author' field: ${hasAuthor ? 'YES (V2)' : 'NO (V1)'}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  console.log('Timescape Beginner Example - Test Requests');
  console.log('==========================================\n');
  
  // Test 1: Request with semantic version v1.0.0 (should NOT have author)
  await makeRequest('/posts', 'v1.0.0');
  
  // Test 2: Request with semantic version v1.1.0 (should have author)
  await makeRequest('/posts', 'v1.1.0');
  
  // Test 3: Request with timestamp (V1 era)
  await makeRequest('/posts', '2025-11-20T12:00:00Z');
  
  // Test 4: Request with timestamp (V2 era)
  await makeRequest('/posts', '2025-11-21T15:00:00Z');
  
  // Test 5: Request with direct TSV (V1)
  await makeRequest('/posts', 'tsv:1732104000-posts-001');
  
  // Test 6: Request with direct TSV (V2)
  await makeRequest('/posts', 'tsv:1732197600-posts-002');
  
  // Test 7: Request without version (should use latest = V2)
  await makeRequest('/posts');
  
  // Test 8: Request specific post by ID with V1
  await makeRequest('/posts/1', 'v1.0.0');
  
  // Test 9: Request specific post by ID with V2
  await makeRequest('/posts/1', 'v1.1.0');
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('All tests completed!');
  console.log(`${'='.repeat(60)}\n`);
}

// Run tests
runTests().catch(console.error);
