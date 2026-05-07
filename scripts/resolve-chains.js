#!/usr/bin/env node
/**
 * DeFiLlama Chain Resolver
 * Resolves chain names to chain IDs and RPC endpoints
 */

const fs = require('fs');
const path = require('path');

// Chain metadata mapping (chain name -> chain ID and RPC)
const CHAIN_METADATA = {  'ethereum': { chain_id: 1, rpc_url: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY' },
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
  'wan': { chain_id: 888, rpc_url: 'https://rpc.wanchain.io' },
  'avax': { chain_id: 43114, rpc_url: 'https://api.avax.network/exchange' },
  'moonriver': { chain_id: 1285, rpc_url: 'https://rpc-moonriver.moonbeam.network' },
  'moonbeam': { chain_id: 1284, rpc_url: 'https://rpc.moonbeam.network' },
  'linea': { chain_id: 50701, rpc_url: 'https://linea.publicnode.com' },
  'op_bnb': { chain_id: 8453, rpc_url: 'https://base-blockscout.com' },
  'era': { chain_id: 5133, rpc_url: 'https://rpc.ankr.com/aurora' },
  'polygon_zkevm': { chain_id: 16696, rpc_url: 'https://polygon-zkevm.rpc.rivet.cloud' },
  'xlayer': { chain_id: 40404, rpc_url: 'https://rpc.xlayer.io' },
  'aurora': { chain_id: 5133, rpc_url: 'https://rpc.ankr.com/aurora' },
  'heco': { chain_id: 128, rpc_url: 'https://http-mainnet.hecochain.com' },
  'okt': { chain_id: 66, rpc_url: 'https://exchainrpc.okex.org' },
  'cronos': { chain_id: 25, rpc_url: 'https://evm-cronos.crypto.com' },
  'kava': { chain_id: 1317, rpc_url: 'https://rpc.kava.io' },
  'fuse': { chain_id: 122, rpc_url: 'https://rpc.fuse.io' },
  'song': { chain_id: 80, rpc_url: 'https://rpc.songbird.network' },
  'fire': { chain_id: 1313, rpc_url: 'https://rpc.ankr.com/ethw' },
  'xdai': { chain_id: 100, rpc_url: 'https://rpc.xdaichain.com' },
  'arbitrum_nova': { chain_id: 42170, rpc_url: 'https://nova.arbitrum.io' },
  'scroll': { chain_id: 9999, rpc_url: 'https://scroll-mainnet.g.alchemy.com' },
  'mode': { chain_id: 84531, rpc_url: 'https://rpc.mode.network' },
  'zksync': { chain_id: 280, rpc_url: 'https://zksync.io' },
  'boba': { chain_id: 288, rpc_url: 'https://bobanet.ankr.com' },
  'harmony': { chain_id: 1666600000, rpc_url: 'https://rpc.harmony.one' },
  'ton': { chain_id: 223317, rpc_url: 'https://ton.rpc.covalent.co' }};

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