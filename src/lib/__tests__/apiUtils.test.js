/**
 * Tests for API utility functions
 * 
 * These tests verify the utility functions work as expected.
 * Note: This is a basic test suite. In a production environment,
 * you would use a proper testing framework like Jest.
 */

import { 
  generateUniqueCode, 
  generateOTP, 
  formatPhoneNumber 
} from '../apiUtils';

// Test generateUniqueCode
function testGenerateUniqueCode() {
  const code = generateUniqueCode();
  
  // Should be 8 characters
  if (code.length !== 8) {
    throw new Error(`Expected code length 8, got ${code.length}`);
  }
  
  // Should be uppercase
  if (code !== code.toUpperCase()) {
    throw new Error(`Expected uppercase code, got ${code}`);
  }
  
  // Should only contain hex characters
  if (!/^[0-9A-F]+$/.test(code)) {
    throw new Error(`Expected hex characters only, got ${code}`);
  }
  
  console.log('✓ generateUniqueCode test passed');
}

// Test generateOTP
function testGenerateOTP() {
  const otp = generateOTP();
  
  // Should be 6 digits
  if (otp.length !== 6) {
    throw new Error(`Expected OTP length 6, got ${otp.length}`);
  }
  
  // Should be numeric
  if (!/^\d+$/.test(otp)) {
    throw new Error(`Expected numeric OTP, got ${otp}`);
  }
  
  // Should be between 100000 and 999999
  const numOtp = parseInt(otp);
  if (numOtp < 100000 || numOtp > 999999) {
    throw new Error(`Expected OTP between 100000 and 999999, got ${otp}`);
  }
  
  console.log('✓ generateOTP test passed');
}

// Test formatPhoneNumber
function testFormatPhoneNumber() {
  // Test 10-digit number
  const result1 = formatPhoneNumber('9876543210');
  if (result1 !== '+919876543210') {
    throw new Error(`Expected +919876543210, got ${result1}`);
  }
  
  // Test already formatted number
  const result2 = formatPhoneNumber('+919876543210');
  if (result2 !== '+919876543210') {
    throw new Error(`Expected +919876543210, got ${result2}`);
  }
  
  // Test 11-digit number (should not modify)
  const result3 = formatPhoneNumber('19876543210');
  if (result3 !== '19876543210') {
    throw new Error(`Expected 19876543210, got ${result3}`);
  }
  
  console.log('✓ formatPhoneNumber test passed');
}

// Run all tests
function runTests() {
  console.log('Running API Utils Tests...\n');
  
  try {
    testGenerateUniqueCode();
    testGenerateOTP();
    testFormatPhoneNumber();
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Export for potential use in other test files
export { testGenerateUniqueCode, testGenerateOTP, testFormatPhoneNumber };

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}
