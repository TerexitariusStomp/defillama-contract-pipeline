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
        result.confidence = chain !== 'unknown' ? 'high' : 'medium';
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
        result.chain = 'unknown';
        result.extraction_pattern = 'constant';
        result.confidence = 'low';
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
  const matches = code.matchAll(/['"`](0x[a-fA-F0-9]{40})['"`]/g);
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