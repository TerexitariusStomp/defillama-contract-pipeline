
// Test script for enhanced ABI extraction
const fs = require('fs');
const path = require('path');

// Include the enhanced extraction function
const { extractABIFromAdapterWithHelpers } = require('./generate-calldata-templates-enhanced.js');

// Path to test-token adapter
const adapterPath = path.join(__dirname, '.hermes', 'defillama-repos', 'DefiLlama-Adapters', 'projects', 'test-token', 'index.js');

if (!fs.existsSync(adapterPath)) {
  console.error('Adapter file not found:', adapterPath);
  process.exit(1);
}

console.log('Testing ABI extraction from:', adapterPath);

// Extract ABI
const abi = extractABIFromAdapterWithHelpers(adapterPath);

console.log('Extracted ABI functions:');
abi.forEach(func => {
  console.log(`- ${func.name} (${func.type})`);
  console.log(`    Inputs:`, func.inputs);
  console.log(`    Outputs:`, func.outputs);
});

console.log('\nSuccess! Extracted', abi.length, 'functions');
