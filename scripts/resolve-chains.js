#!/usr/bin/env node
/**
 * DeFiLlama Chain Resolver
 * Resolves chain names to chain IDs and RPC endpoints
 */

const fs = require('fs');
const path = require('path');

// Chain metadata mapping (chain name -> chain ID and RPC)
const CHAIN_METADATA = {
  'ethereum': { chain_id: 1, rpc_url: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY' },
  'arbitrum': { chain_id: 42161, rpc_url: 'https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY' },
  'optimism': { chain_id: 10, rpc_url: 'https://mainnet.optimism.io' },
  'polygon': { chain_id: 137, rpc_url: 'https://polygon-rpc.com' },
  'bsc': { chain_id: 56, rpc_url: 'https://bsc-dataseed.binance.org' },
  'avalanche': { chain_id: 43114, rpc_url: 'https://api.avax.network/exchange' },
  'base': { chain_id: 8453, rpc_url: 'https://base-blockscout.com' },
  'celo': { chain_id: 42220, rpc_url: 'https://forno.celo.org' },
  'fantom': { chain_id: 250, rpc_url: 'https://rpc.ftm.tools' },
  'gnosis': { chain_id: 100, rpc_url: 'https://rpc.xdaichain.com' },
  'solana': { chain_id: 101, rpc_url: 'https://solana-api.projectserum.com' },
  'cosmos': { chain_id: 118, rpc_url: 'https://stargate.cosmos.network' },
  // Add more chains as needed
};

function resolveChain(chainName) {
  const normalized = chainName.toLowerCase().trim();
  return CHAIN_METADATA[normalized] || { chain_id: -1, rpc_url: null, name: chainName };
}

// Main execution
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node scripts/resolve-chains.js <output_dir>');
  process.exit(1);
}

const outputDir = args[0];
const inputPath = path.join(outputDir, '02_extracted_contracts.json');

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const contracts = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
const enriched = [];

for (const contract of contracts) {
  const chainInfo = resolveChain(contract.chain);
  enriched.push({
    ...contract,
    chain_id: chainInfo.chain_id,
    rpc_url: chainInfo.rpc_url,
    chain_name: chainInfo.name || contract.chain
  });
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, '03_enriched_contracts.json');
fs.writeFileSync(outputPath, JSON.stringify(enriched, null, 2));

console.log(`\\n=== Chain Resolution Complete ===`);
console.log(`Resolved ${enriched.length} contracts`);
console.log(`Results saved to ${outputPath}`);