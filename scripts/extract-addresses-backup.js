#!/usr/bin/env node
/**
 * DeFiLlama Adapter Address Extractor
 * Extracts contract addresses from DeFiLlama adapters using AST parsing
 * 
 * Usage: node scripts/extract-addresses.js <output_dir>
 */

const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

class ExtractedContract {
  constructor() {
    this.protocol_slug = '';
    this.adapter_file = '';
    this.address = '';
    this.chain = 'unknown';
    this.extraction_pattern = '';
    this.abi_inline = undefined;
    this.confidence = 'high';
  }
}

// Enhanced chain inference functions
function inferChainFromAddress(address) {
  const lowerAddr = address.toLowerCase();
  
  // Non-EVM chains (based on address prefix)
  if (lowerAddr.startsWith('so')) {
    // Solana program address (base58, starts with 'So')
    return 'solana';
  }
  if (lowerAddr.startsWith('cosmos1')) {
    return 'cosmos';
  }
  if (lowerAddr.startsWith('t')) {
    // TRON address
    return 'tron';
  }
  if (lowerAddr.startsWith('1') || lowerAddr.startsWith('3') || lowerAddr.startsWith('bc1')) {
    // Bitcoin addresses
    return 'bitcoin';
  }
  if (lowerAddr.startsWith('bnb')) {
    // Binance Smart Chain (BEP-20) addresses often start with 'bnb'
    return 'bsc';
  }
  if (lowerAddr.startsWith('0x') && lowerAddr.length === 42) {
    // EVM address format - could be any EVM chain
    // We'll need to infer from protocol or leave as unknown
    return null; // null means need to infer from protocol
  }
  
  // Default for other patterns
  return null;
}

function inferChainFromProtocol(protocolSlug) {
  // Map of protocol slug keywords to chains (enhanced version)
  const PROTOCOL_CHAINS = {
    // Solana
    'solana': 'solana',
    'phantom': 'solana',
    'raydium': 'solana',
    'orca': 'solana',
    'saber': 'solana',
    'lido': 'solana', // Lido on Solana
    'marginfi': 'solana',
    'kamino': 'solana',
    'jupiter': 'solana',
    'step': 'solana',
    'apecoin': 'solana',
    'audius': 'solana',
    'beneva': 'solana',
    'brevis': 'solana',
    'cable': 'solana',
    'cafeswap': 'solana',
    'chainge': 'solana',
    'creams': 'solana',
    'crypto': 'solana',
    'cyclone': 'solana',
    'defy': 'solana',
    'defyodds': 'solana',
    'dexlab': 'solana',
    'dmarket': 'solana',
    'dolphin': 'solana',
    'durian': 'solana',
    'escape': 'solana',
    'falcon': 'solana',
    'firstdigital': 'solana',
    'form': 'solana',
    'frank': 'solana',
    'frax': 'solana',
    'genopets': 'solana',
    'gold': 'solana',
    'goki': 'solana',
    'hord': 'solana',
    'ism': 'solana',
    'jito': 'solana',
    'katana': 'solana',
    'kill': 'solana',
    'klima': 'solana',
    'krack': 'solana',
    'larix': 'solana',
    'lend-sol': 'solana',
    'levins': 'solana',
    'light': 'solana',
    'like': 'solana',
    'lqd': 'solana',
    'magiceden': 'solana',
    'media': 'solana',
    'metaplex': 'solana',
    'minefields': 'solana',
    'morpheus': 'solana',
    'mrgn': 'solana',
    'myria': 'solana',
    'neural': 'solana',
    'nexis': 'solana',
    'nexus': 'solana',
    'nova': 'solana',
    'nox': 'solana',
    'nusd': 'solana',
    'nyle': 'solana',
    'odira': 'solana',
    'omen': 'solana',
    'one': 'solana',
    'only1': 'solana',
    'orca': 'solana',
    'pancakeswap': 'solana', // cross-chain
    'pyth': 'solana',
    'quarry': 'solana',
    'ray': 'solana',
    'rose': 'solana',
    'samoyed': 'solana',
    'saber': 'solana',
    'sacred': 'solana',
    'salmon': 'solana',
    'samurai': 'solana',
    'sapiens': 'solana',
    'sbr': 'solana',
    'scope': 'solana',
    'seagull': 'solana',
    'seafood': 'solana',
    'shdw': 'solana',
    'shi-fu': 'solana',
    'shino': 'solana',
    'shrapnel': 'solana',
    'silo': 'solana',
    'six': 'solana',
    'sols': 'solana',
    'solspec': 'solana',
    'sors': 'solana',
    'soul': 'solana',
    'source': 'solana',
    'splin': 'solana',
    'sundae': 'solana',
    'sundae-swap': 'solana',
    'superstate': 'solana',
    'swell': 'solana',
    'taiko': 'solana',
    'taper': 'solana',
    'tars': 'solana',
    'tau': 'solana',
    'tulip': 'solana',
    'turtle': 'solana',
    'type': 'solana',
    'uprock': 'solana',
    'usdcoin': 'solana',
    'ux': 'solana',
    'valkyrie': 'solana',
    'viper': 'solana',
    'virtual': 'solana',
    'visor': 'solana',
    'viv': 'solana',
    'vmp': 'solana',
    'voltz': 'solana',
    'vtr': 'solana',
    'wagme': 'solana',
    'whale': 'solana',
    'wolf': 'solana',
    'wormhole': 'solana',
    'yard': 'solana',
    'zest': 'solana',
    'zksync': 'solana', // zksync is a separate chain but sometimes grouped
    
    // Cosmos
    'cosmos': 'cosmos',
    'osmosis': 'cosmos',
    'akash': 'cosmos',
    'band': 'cosmos',
    'terra': 'cosmos',
    'thorchain': 'cosmos',
    'secret': 'cosmos',
    'persistence': 'cosmos',
    'kava': 'cosmos',
    'iris': 'cosmos',
    'bitsong': 'cosmos',
    'cheqd': 'cosmos',
    'crescent': 'cosmos',
    'e-money': 'cosmos',
    'fetch': 'cosmos',
    'frictionless': 'cosmos',
    'gno': 'cosmos',
    'injective': 'cosmos',
    'juno': 'cosmos',
    'kx': 'cosmos',
    'lands': 'cosmos',
    'marlin': 'cosmos',
    'mass': 'cosmos',
    'memphis': 'cosmos',
    'milky': 'cosmos',
    'nim': 'cosmos',
    'nyx': 'cosmos',
    'osmo': 'cosmos',
    'pallada': 'cosmos',
    'persistence': 'cosmos',
    'pisco': 'cosmos',
    'quicksilver': 'cosmos',
    'regen': 'cosmos',
    'relayers': 'cosmos',
    'secret': 'cosmos',
    'shade': 'cosmos',
    ' singularity': 'cosmos',
    'sommelier': 'cosmos',
    'stars': 'cosmos',
    'stargaze': 'cosmos',
    'starname': 'cosmos',
    'starship': 'cosmos',
    'stella': 'cosmos',
    'stellaswap': 'cosmos',
    'stx': 'cosmos',
    'sun': 'cosmos',
    'sunrise': 'cosmos',
    'swap': 'cosmos',
    'tgrade': 'cosmos',
    'umee': 'cosmos',
    'uranus': 'cosmos',
    'vortex': 'cosmos',
    'whiteheart': 'cosmos',
    'wick': 'cosmos',
    'xanchor': 'cosmos',
    'xchain': 'cosmos',
    'xeon': 'cosmos',
    'xiot': 'cosmos',
    'xplanet': 'cosmos',
    'yup': 'cosmos',
    'zen': 'cosmos',
    'zodiac': 'cosmos',
    
    // TRON
    'tron': 'tron',
    'just': 'tron',
    'sun': 'tron',
    'wink': 'tron',
    'bittorrent': 'tron',
    'dao': 'tron',
    'dlive': 'tron',
    'jus': 'tron',
    'knox': 'tron',
    'nix': 'tron',
    'sr': 'tron',
    'trx': 'tron',
    
    // Bitcoin
    'bitcoin': 'bitcoin',
    'stacks': 'bitcoin',
    'pox': 'bitcoin',
    'lightning': 'bitcoin',
    'block': 'bitcoin',
    'blockchain': 'bitcoin',
    'bitgo': 'bitcoin',
    'blockstream': 'bitcoin',
    'liquality': 'bitcoin',
    'lnp': 'bitcoin',
    'mir': 'bitcoin',
    'nbx': 'bitcoin',
    'purse': 'bitcoin',
    'river': 'bitcoin',
    'swan': 'bitcoin',
    'ten31': 'bitcoin',
    'veriphi': 'bitcoin',
    'voyager': 'bitcoin',
    
    // Ethereum L2s and sidechains
    'arbitrum': 'arbitrum',
    'optimism': 'optimism',
    'polygon': 'polygon',
    'base': 'base',
    'linea': 'linea',
    'zksync': 'zksync',
    'arbitrum': 'arbitrum',
    'avalanche': 'avax',
    'celo': 'celo',
    'fantom': 'fantom',
    'gnosis': 'xdai',
    'bsc': 'bsc',
    'heco': 'heco',
    'okt': 'okt',
    
    // Ethereum mainnet
    'aave': 'ethereum',
    'aave-v1': 'ethereum',
    'aave-v2': 'ethereum',
    'aave-v3': 'ethereum',
    'aave-v4': 'ethereum',
    'compound': 'ethereum',
    'uniswap': 'ethereum',
    'uniswap-v2': 'ethereum',
    'uniswap-v3': 'ethereum',
    'uniswap-v4': 'ethereum',
    'maker': 'ethereum',
    'dai': 'ethereum',
    'yearn': 'ethereum',
    'yearn-finance': 'ethereum',
    'lido': 'ethereum',
    'curve': 'ethereum',
    'balancer': 'ethereum',
    'synthetic': 'ethereum',
    'sushiswap': 'ethereum',
    'instadapp': 'ethereum',
    'dydx': 'ethereum',
    'synthetix': 'ethereum',
    'keep': 'ethereum',
    'uma': 'ethereum',
    'airswap': 'ethereum',
    'bzx': 'ethereum',
    'connext': 'ethereum',
    'deck': 'ethereum',
    'dforce': 'ethereum',
    'melon': 'ethereum',
    'nftx': 'ethereum',
    'opyn': 'ethereum',
    'set': 'ethereum',
    'tellor': 'ethereum',
    'uma': 'ethereum',
    'unisocks': 'ethereum',
    'value': 'ethereum',
    'vega': 'ethereum',
    'velodrome': 'ethereum',
    'vsp': 'ethereum',
    'wormhole': 'ethereum',
    
    // Other chains
    'xdai': 'xdai',
    'gnosis': 'xdai',
    'kava': 'cosmos',
    'harmony': 'harmony',
    'near': 'near',
    'aurora': 'near',
    'algorand': 'algorand',
    'elrond': 'elrond',
    'icon': 'icon',
    'ontology': 'ontology',
    'vechain': 'vechain',
    'theta': 'theta',
    'waves': 'waves',
    'xdai': 'xdai',
    'zilliqa': 'zilliqa',
    'kardiachain': 'kardiachain',
    'ontology': 'ontology',
    'pulsechain': 'pulsechain',
    'shiden': 'shiden',
    'sora': 'sora',
    'tomo': 'tomo',
    'wanchain': 'wanchain',
    'zksync': 'zksync',
    'base': 'base',
    'linea': 'linea',
    'mode': 'mode',
    'scroll': 'scroll',
    'zkevm': 'zkevm',
    'opbnb': 'opbnb',
    'op': 'optimism',
    'optimism': 'optimism',
    'xdai': 'xdai',
  };
  
  // Check for exact matches first
  if (PROTOCOL_CHAINS[protocolSlug]) {
    return PROTOCOL_CHAINS[protocolSlug];
  }
  
  // Check for partial matches (protocols that contain keywords)
  for (const [key, chain] of Object.entries(PROTOCOL_CHAINS)) {
    if (protocolSlug.includes(key) && key.length > 2) {
      return chain;
    }
  }
  
  return null; // null means we couldn't infer from protocol
};

  // Check for exact matches first
  if (PROTOCOL_CHAINS[protocolSlug]) {
    return PROTOCOL_CHAINS[protocolSlug];
  }

  // Check for partial matches (protocols that contain keywords)
  for (const [key, chain] of Object.entries(PROTOCOL_CHAINS)) {
    if (protocolSlug.includes(key) && key.length > 2) {
      return chain;
    }
  }

  return null; // null means we couldn't infer from protocol
}

function normalizeChainName(raw) {
  const MAP = {
    ethereum: 'ethereum', eth: 'ethereum',
    arbitrum: 'arbitrum', arb: 'arbitrum',
    optimism: 'optimism', op: 'optimism',
    polygon: 'polygon', matic: 'polygon',
    bsc: 'bsc', binance: 'bsc',
    avalanche: 'avax', avax: 'avax',
    base: 'base',
    celo: 'celo',
    fantom: 'fantom', ftm: 'fantom',
    gnosis: 'xdai', xdai: 'xdai',
    solana: 'solana',
    cosmos: 'cosmos',
  };
  return MAP[raw.toLowerCase()] || raw.toLowerCase() || 'unknown';
}

function extractFromFile(filePath, protocolSlug) {
  const results = [];
  let code;

  try {
    code = fs.readFileSync(filePath, 'utf-8');
    console.log(`  Parsing ${filePath} (${code.length} bytes)`);
  } catch (e) {
    console.log(`    Cannot read file: ${filePath}`);
    return results;
  }

  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
      errorRecovery: true,
    });
    console.log('  Parsed with AST');
  } catch (e) {
    console.log(`    AST parse failed, using regex fallback: ${e.message}`);
    return regexFallbackExtract(code, filePath, protocolSlug);
  }

  let found = 0;

  try {

    traverse(ast, {
    ObjectExpression(path) {
      const props = path.node.properties;
      let target = null;
      let chain = 'unknown';
      let abiValue = null;

      for (const prop of props) {
        if (!prop.key) continue;
        const key = prop.key.name || prop.key.value;

        if (key === 'target' && prop.value.type === 'StringLiteral') {
          const val = prop.value.value;
          if (ADDRESS_REGEX.test(val)) target = val;
        }
        if (key === 'chain' && prop.value.type === 'StringLiteral') {
          chain = prop.value.value;
        }
        if (key === 'abi') {
          if (prop.value.type === 'StringLiteral') {
            abiValue = prop.value.value;
          }
        }
      }

      if (target) {
        const result = new ExtractedContract();
        result.protocol_slug = protocolSlug;
        result.adapter_file = filePath;
        result.address = target;
        result.chain = chain;
        result.extraction_pattern = 'sdk_call';
        result.abi_inline = abiValue;
        
        // Apply chain inference if still unknown
        if (result.chain === 'unknown') {
          const inferred = inferChainFromAddress(result.address);
          if (inferred) {
            result.chain = inferred;
            result.confidence = 'medium';
          } else {
            const inferredProto = inferChainFromProtocol(protocolSlug);
            if (inferredProto) {
              result.chain = inferredProto;
              result.confidence = 'medium';
            } else {
              result.confidence = 'low';
            }
          }
        } else {
          result.confidence = 'high';
        }
        
        results.push(result);
        found++;
      }
    },

    VariableDeclarator(path) {
      const init = path.node.init;
      if (init && init.type === 'StringLiteral' && ADDRESS_REGEX.test(init.value)) {
        const result = new ExtractedContract();
        result.protocol_slug = protocolSlug;
        result.adapter_file = filePath;
        result.address = init.value;
        
        // Try to infer chain from address and protocol
        const inferredAddr = inferChainFromAddress(init.value);
        if (inferredAddr) {
          result.chain = inferredAddr;
          result.confidence = 'medium';
        } else {
          const inferredProto = inferChainFromProtocol(protocolSlug);
          if (inferredProto) {
            result.chain = inferredProto;
            result.confidence = 'medium';
          } else {
            result.chain = 'unknown';
            result.confidence = 'low';
          }
        }
        
        result.extraction_pattern = 'constant';
        results.push(result);
        found++;
      }
      if (init && init.type === 'ObjectExpression') {
        for (const prop of init.properties) {
          const key = prop.key.name || prop.key.value;
          const val = prop.value.value;
          if (val && ADDRESS_REGEX.test(val)) {
            const result = new ExtractedContract();
            result.protocol_slug = protocolSlug;
            result.adapter_file = filePath;
            result.address = val;
            // Try to infer chain from the key (property name)
            result.chain = normalizeChainName(key);
            result.extraction_pattern = 'constant';
            result.confidence = 'high';
            results.push(result);
            found++;
          }
        }
      }
    },

    CallExpression(path) {
      // Check for sdk.api.erc20.balanceOf({ owner: '0x...', chain: '...' })
      const callee = path.node.callee;
      
      // Pattern: sdk.api.erc20.balanceOf(...)
      let isErc20Call = false;
      if (
        callee.object && 
        callee.object.type === 'MemberExpression' &&
        callee.object.object && 
        callee.object.object.name === 'sdk' &&
        callee.object.property && 
        callee.object.property.name === 'erc20' &&
        callee.property && 
        callee.property.name === 'balanceOf'
      ) {
        isErc20Call = true;
      }

      if (isErc20Call && path.node.arguments[0].type === 'ObjectExpression') {
        const props = path.node.arguments[0].properties;
        for (const prop of props) {
          const key = prop.key.name || prop.key.value;
          if (
            (key === 'owner' || key === 'target') &&
            prop.value.type === 'StringLiteral' &&
            ADDRESS_REGEX.test(prop.value.value)
          ) {
            const chainProp = props.find(p => (p.key.name || p.key.value) === 'chain');
            const result = new ExtractedContract();
            result.protocol_slug = protocolSlug;
            result.adapter_file = filePath;
            result.address = prop.value.value;
            result.chain = chainProp ? chainProp.value.value : 'unknown';
            result.extraction_pattern = 'erc20';
            result.confidence = 'medium';
            results.push(result);
            found++;
          }
        }
      }
    },


    });

  } catch (e) {
    console.log(`    Traversal failed, using regex fallback: ${e.message}`);
    return regexFallbackExtract(code, filePath, protocolSlug);
  }

  console.log(`  Found ${found} addresses`);
  return results;
}

function regexFallbackExtract(code, filePath, slug) {
  const results = [];
  const matches = code.matchAll(/['"](0x[a-fA-F0-9]{40})['"]/g);
  let count = 0;
  for (const match of matches) {
    const result = new ExtractedContract();
    result.protocol_slug = slug;
    result.adapter_file = filePath;
    result.address = match[1];
    result.chain = 'unknown';
    result.extraction_pattern = 'constant';
    result.confidence = 'low';
    results.push(result);
    count++;
  }
  console.log(`  Regex fallback found ${count} addresses`);
  return results;
}

// Main execution
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node extract-addresses.js <output_dir>');
  process.exit(1);
}

const outputDir = args[0];
const protocols = JSON.parse(fs.readFileSync('output/01_protocol_registry.json', 'utf-8'));

const allContracts = [];

for (const protocol of protocols) {
  if (!protocol.module) continue;

  // Prepend 'projects/' to the module path
  const modulePath = protocol.module.startsWith('projects/') ? protocol.module : `projects/${protocol.module}`;
  // When running from within the DefiLlama-Adapters directory, the adapter file is just modulePath
  const adapterPath = modulePath;
  console.log(`Checking: ${adapterPath}`);
  const exists = fs.existsSync(adapterPath);
  console.log(`  Exists: ${exists}`);
  
  if (!exists) {
    console.log(`  Adapter not found: ${adapterPath} for protocol ${protocol.id}`);
    continue;
  }

  const dir = path.dirname(adapterPath);
  const siblingFiles = [
    adapterPath,
    ...glob.sync(`${dir}/**/*.{js,ts,json}`).slice(0, 20),
  ].filter(f => f !== adapterPath);

  console.log(`  Processing protocol: ${protocol.slug} (${adapterPath})`);
  console.log(`  Sibling files: ${siblingFiles.length}`);

  for (const file of [adapterPath, ...siblingFiles]) {
    console.log(`    Extracting from ${file}...`);
    const extracted = extractFromFile(file, protocol.slug);
    allContracts.push(...extracted);
  }
}

// Deduplicate: same address+chain = one record
const deduped = Object.values(
  allContracts.reduce((acc, c) => {
    const key = `${c.chain}:${c.address.toLowerCase()}`;
    if (!acc[key] || c.confidence > acc[key].confidence) {
      acc[key] = c;
    }
    return acc;
  }, {})
);

// Save results
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
  `${outputDir}/02_extracted_contracts.json`,
  JSON.stringify(deduped, null, 2)
);

console.log(`\n=== Extraction Complete ===`);
console.log(`Extracted ${deduped.length} unique contract addresses`);
console.log(`Results saved to ${outputDir}/02_extracted_contracts.json`);
