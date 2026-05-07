
const fs = require('fs');
const path = require('path');

// Load final contracts data
const contractsPath = '/home/terexitarius/defillama-contract-pipeline/output/final_contracts.json';
const contracts = require(contractsPath);

let successCount = 0;
let failCount = 0;
let helperBasedCount = 0;

console.log("Testing ABI extraction on", contracts.length, "contracts...");

contracts.forEach((contract, index) => {
  // Construct adapter path
  const adapterPath = path.join('/home/terexitarius', '.hermes', 'defillama-repos', 'DefiLlama-Adapters', contract.adapter_file);
  
  if (fs.existsSync(adapterPath)) {
    const adapterContent = fs.readFileSync(adapterPath, 'utf8');
    
    // Try to extract ABI using the patterns from the script
    let abiMatch = adapterContent.match(/abi\s*[=:]\s*(\[[^\]]+\]|\{[^}]+\})\s*[;,]?/s);
    if (!abiMatch) {
      abiMatch = adapterContent.match(/abi\s*:\s*(\[[^\]]+\]|\{[^}]+\})\s*[;,]?/s);
    }
    if (!abiMatch) {
      abiMatch = adapterContent.match(/abi\s*=\s*(\[[^\]]+\]|\{[^}]+\})\s*[;,]?/s);
    }
    
    if (abiMatch) {
      successCount++;
      if (index < 10) {
        console.log(`✅ ${contract.protocol_slug}: ABI found (length: ${abiMatch[1].length})`);
      }
    } else {
      failCount++;
      // Check if it's a helper-based adapter
      if (adapterContent.includes('require') && !adapterContent.includes('abi')) {
        helperBasedCount++;
        if (index < 10) {
          console.log(`⚠️  ${contract.protocol_slug}: No direct ABI (helper-based)`);
        }
      } else if (index < 10) {
        console.log(`❌ ${contract.protocol_slug}: No ABI found`);
      }
    }
  } else {
    failCount++;
    if (index < 10) {
      console.log(`❌ ${contract.protocol_slug}: Adapter file not found`);
    }
  }
  
  // Show progress
  if ((index + 1) % 100 === 0) {
    console.log(`Processed ${index + 1}/${contracts.length} contracts...`);
  }
});

console.log(`\n=== Results ===`);
console.log(`Success (ABI found): ${successCount} (${(successCount / contracts.length * 100).toFixed(1)}%)`);
console.log(`Failed (no ABI): ${failCount} (${(failCount / contracts.length * 100).toFixed(1)}%)`);
console.log(`  Of those, helper-based: ${helperBasedCount}`);
console.log(`Total contracts: ${contracts.length}`);
