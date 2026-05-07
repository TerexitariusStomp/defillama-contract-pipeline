#!/usr/bin/env node
/**
 * DeFiLlama Finalize Output
 * Produces final output files from enriched contracts
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node scripts/finalize-output.js <output_dir>');
  process.exit(1);
}

const outputDir = args[0];
const inputPath = path.join(outputDir, '03_enriched_contracts.json');

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const contracts = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

// Deduplicate contracts (if not already done)
const deduped = [];
const seen = new Set();

for (const contract of contracts) {
  const key = `${contract.chain}:${contract.address.toLowerCase()}`;
  if (!seen.has(key)) {
    seen.add(key);
    deduped.push(contract);
  }
}

// Group by chain
const byChain = {};
for (const contract of deduped) {
  if (!byChain[contract.chain]) {
    byChain[contract.chain] = [];
  }
  byChain[contract.chain].push(contract);
}

// Group by protocol
const byProtocol = {};
for (const contract of deduped) {
  const slug = contract.protocol_slug;
  if (!byProtocol[slug]) {
    byProtocol[slug] = [];
  }
  byProtocol[slug].push(contract);
}

// Save output files
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const finalPath = path.join(outputDir, 'final_contracts.json');
const byChainPath = path.join(outputDir, 'contracts_by_chain.json');
const byProtocolPath = path.join(outputDir, 'contracts_by_protocol.json');

fs.writeFileSync(finalPath, JSON.stringify(deduped, null, 2));
fs.writeFileSync(byChainPath, JSON.stringify(byChain, null, 2));
fs.writeFileSync(byProtocolPath, JSON.stringify(byProtocol, null, 2));

console.log(`\\n=== Finalize Output Complete ===`);
console.log(`Final contracts saved to ${finalPath}`);
console.log(`By chain saved to ${byChainPath}`);
console.log(`By protocol saved to ${byProtocolPath}`);
console.log(`Total unique contracts: ${deduped.length}`);