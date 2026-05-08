#!/usr/bin/env node



/**

 * Calldata Template Generator

 * Generates comprehensive calldata templates for all extracted contracts

 */



const fs = require('fs');

const path = require('path');



// Load final contracts data

const contractsPath = path.join(__dirname, '..', 'output', 'final_contracts.json');

const contracts = require(contractsPath);



// Common DeFi function selectors (4-byte method IDs)

const COMMON_FUNCTION_SELECTORS = {

  // ERC-20

  transfer: 'a9059cbb',

  transferFrom: '23b872dd',

  approve: '095ea7b3',

  allowance: 'dd62ed3e',

  balanceOf: '70a08231',

  totalSupply: '18160ddd',

  

  // ERC-721

  safeTransferFrom: '23b872dd', // Same as transferFrom for ERC-721

  approve: '095ea7b3',

  getApproved: '42842e0e',

  setApprovalForAll: '4e71d92d',

  isApprovedForAll: 'e985e9c5',

  safeTransferFrom: 'f2fde38b',

  safeTransferFrom: '23b872dd', // Alternative signature

  

  // Uniswap V2

  getReserves: '0x2a0629d8',

  quote: '0xb6c42089',

  swapExactTokensForTokens: '0x38ed1739',

  swapExactETHForTokens: '0x7ff91ee6',

  addLiquidity: '0x8c5c2b67',

  removeLiquidity: '0x0d36d445',

  

  // Aave

  deposit: '0xaf080e0c',

  withdraw: '0x4ddc2926',

  borrow: '0x17268e38',

  repay: '0x3c3e7b2b',

  flashLoan: '0x0f59e7e4',

  

  // Compound

  mint: '0xe6f5fa0c',

  redeem: '0x4b5a4e63',

  borrow: '0x8da9d7ca',

  repayBorrow: '0x914a30c1',

  liquidateBorrow: '0x5e76db0c',

  

  // Curve

  exchange: '0xb440ddcc',

  exchangeUnderlying: '0x7f5c7d8d',

  add_liquidity: '0x9b9b6a0c',

  remove_liquidity: '0x8bc0a4d4',

  remove_liquidity_one_coin: '0x4b5a4e63',

  

  // Yearn

  deposit: '0x3936f0ce',

  withdraw: '0x442af7a0',

  zapIn: '0x3c3e7b2b',

  zapOut: '0x8da9d7ca'

};



// Chain-specific RPC endpoints

const CHAIN_RPC_ENDPOINTS = {

  1: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',

  5: 'https://goerli.infura.io/v3/YOUR_INFURA_KEY',

  137: 'https://rpc-mainnet.matic.network',

  56: 'https://bsc-dataseed.binance.org/',

  97: 'https://data-seed-prebsc-1.binance.org:60543',

  250: 'https://rpc.ftm.tools/',

  66: 'https://cloudflare-eth.com',

  10: 'https://rpc.xdaichain.com',

  137: 'https://polygon-rpc.com',

  43114: 'https:// avalanche -network.org',

  79377: 'https://rpc.ankr.com/arbiter',

  5133: 'https://rpc.ankr.com/aurora',

  42161: 'https://fulcrum-web3-1.ondemand.sologenic.org',

  1287: 'https://rpc.ankr.com/ftm',

  99: 'https://rpc.ankr.com/harmony',

  59140: 'https://rpc.ankr.com/optimism',

  10197: 'https://rpc.ankr.com/polygon_zkevm',

  42220: 'https://rpc.ankr.com/avalanche_evo',

  1313: 'https://rpc.ankr.com/ethw',

  1: 'https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_KEY',

  5: 'https://eth-goerli.alchemyapi.io/v2/YOUR_ALCHEMY_KEY',

  137: 'https://polygon-mainnet.g.alchemy.com/jsonrpc',

  56: 'https://bsc-mainnet.g.alchemy.com/jsonrpc',

  10: 'https://xdai-mainnet.g.alchemy.com/jsonrpc'

};





/** 

 * Infer chain from adapter content (RPC URLs, chain IDs, etc.)

 * @param {string} adapterContent - Content of the adapter JavaScript file

 * @returns {string|null} - Inferred chain name or null if unknown

 */

function inferChainFromAdapterContent(adapterContent) {

  if (!adapterContent) return null;

  

  // Look for common RPC URLs or chain identifiers

  const chainPatterns = {

    'ethereum': [/eth\.scan/i, /etherscan\.io/, /eth-rpc\.io/, /infura\/eth/],

    'bsc': [/bscscan\.com/, /bsc-dataseed\.binance\.org/, /bsc/],

    'polygon': [/polygonscan\.com/, /polygon-rpc\.com/, /matic/],

    'avalanche': [/snowtrace\.io/, /avalanche-rpc\.ava\.labs/],

    'arbitrum': [/arbiscan\.io/, /arbitrum/],

    'optimism': [/optimistic\.xyz/, /optimism/],

    'linea': [/linea\.io/, /linea/],

    'base': [/baserow\.io/, /base/],

    'scroll': [/scroll\.io/, /scroll/],

    'zkevm': [/zkevm/],

    'fantom': [/ftmscan\.com/, /fantom/],

    'cronos': [/cronoscan\.com/, /cronos/],

    'celo': [/celoscan\.io/, /celo/],

    'heco': [/hecoinfo\.com/, /heco/],

    'okex': [/okexchain\.io/, /okex/],

    'kava': [/kava\.io/, /kava/],

    'harmony': [/harmony\.one/, /harmony/],

    'aurora': [/aurora\.io/, /aurora/],

    'gnosis': [/gnosisscan\.io/, /gnosis/],

    'moonbeam': [/moonbeam\.network/, /moonbeam/],

    'moonriver': [/moonriver\.network/, /moonriver/],

    'astral': [/astral\.io/, /astral/],

    'sonoma': [/sonoma/],

    'opium': [/opium/],

    'tron': [/tronscan\.org/, /tron/],

    'cosmos': [/cosmos\.io/, /cosmos/],

    'solana': [/solscan\.io/, /solana/],

    'bitcoin': [/blockchain\.com/, /bitcoin/],

    'litecoin': [/litecoin\.org/, /litecoin/],

    'dogecoin': [/dogechain\.info/, /dogecoin/],

    'cardano': [/cardanoscan\.io/, /cardano/],

    'polkadot': [/polkadot\.io/, /polkadot/],

    'kusama': [/kusama\.network/, /kusama/],

    'near': [/nearscan\.io/, /near/],

    'algorand': [/algorand\.org/, /algorand/],

    'hedera': [/hedera\/hashgraph/, /hedera/],

    'ripple': [/xrpl\.org/, /ripple/],

    'stellar': [/stellar\.org/, /stellar/],

    'eos': [/eos\.io/, /eos/],

    'tezos': [/tezos\.com/, /tezos/],

    'filecoin': [/filecoin\.io/, /filecoin/],

    'chainlink': [/chainlink\.oracle/, /chainlink/],

    'the-Graph': [/thegraph\.com/, /graph/],

    'livepeer': [/livepeer\.org/, /livepeer/],

    'ruflin': [/ruflin\.com/, /ruflin/],

    'pooltogether': [/pooltogether\.com/, /pooltogether/],

    'unisocks': [/unisocks\.app/, /unisocks/],

    'tokenlon': [/tokenlon\.io/, /tokenlon/],

    'dydx': [/dydx\.exchange/, /dydx/],

    'maker': [/makerdao\.com/, /maker/],

    'uniswap': [/uniswap\.org/, /uniswap/],

    'aave': [/aave\.com/, /aave/],

    'compound': [/compound\.finance/, /compound/],

    'curve': [/curve\.finance/, /curve/],

    'yearn': [/yearn\.finance/, /yearn/],

    'sushi': [/sushi\.com/, /sushi/],

    'pancakeswap': [/pancakeswap\.finance/, /pancake/],

    'balancer': [/balancer\.finance/, /balancer/],

    'hop': [/hop-protocol\.org/, /hop/],

    'synapse': [/synapsebridge\.com/, /synapse/],

    'layerzero': [/layerzero\.network/, /layerzero/],

    'axelar': [/axelar\.network/, /axelar/],

    'wormhole': [/wormhole\.crypto/, /wormhole/]

  };

  

  // Check each chain pattern

  for (const [chain, patterns] of Object.entries(chainPatterns)) {

    if (patterns.some(pattern => pattern.test(adapterContent))) {

      return chain;

    }

  }

  

  // Fallback: Try to infer chain from adapter file name or path

  // This would need to be passed in or extracted from the file path

  // For now, we'll leave this as a placeholder for future enhancement

  return null;

}





/**

 * Generate calldata template for a single contract

 */

function generateCalldataTemplate(contract) {

  

  const template = {

    contract_address: contract.address,

    chain_id: contract.chain_id,

    chain_name: contract.chain_name,

    protocol: contract.protocol_slug_slug,

    adapter_file: contract.adapter_file,

    rpc_url: CHAIN_RPC_ENDPOINTS[contract.chain_id] || `https://rpc.${contract.chain_name}.io`,

    abi: [],

    function_selectors: {},

    calldata: {},  // Renamed from example_calldata

    notes: []

  };



  // Try to extract ABI from adapter file if available

  try {

    console.log(`Processing ${contract.protocol_slug_slug}, adapter_file: ${contract.adapter_file}`);

    const adapterPath = path.join(__dirname, '..', '.hermes', 'defillama-repos', 'DefiLlama-Adapters', contract.adapter_file.replace(/^projects\//, ''));

    if (fs.existsSync(adapterPath)) {

      const adapterContent = fs.readFileSync(adapterPath, 'utf8');

      

      // Extract ABI if present - handle both array and object forms

      let abiMatch = adapterContent.match(/abi\s*[=:]\s*(\[[^\]]+\]|\{[^}]+\})\s*[;,]?/s);

      if (!abiMatch) {

        // Try alternative pattern: abi: [ or abi: {

        abiMatch = adapterContent.match(/abi\s*:\s*(\[[^\]]+\]|\{[^}]+\})\s*[;,]?/s);

      }

      if (!abiMatch) {

        // Try assignment pattern: abi = 

        abiMatch = adapterContent.match(/abi\s*=\s*(\[[^\]]+\]|\{[^}]+\})\s*[;,]?/s);

      }

      console.log(`[${contract.protocol_slug_slug}]: ` + (abiMatch ? 'match found' : 'no match') + (abiMatch && abiMatch[1] ? ', content: ' + abiMatch[1].slice(0,100) : ''));

      if (abiMatch) {

        try {

          let abi = JSON.parse(abiMatch[1]);

          

          // Handle different ABI formats

          if (Array.isArray(abi)) {

            // Standard format: array of function objects

            template.abi = abi;

          } else if (typeof abi === 'object' && abi !== null) {

            // Object format: convert to array of function objects

            // Keys are function names, values are signature strings or objects

            template.abi = Object.keys(abi).map(name => {

              const sig = abi[name];

              // If sig is a string, parse it to extract function name and inputs

              if (typeof sig === 'string') {

                // Try to parse signature like "transfer(address,uint256)"

                const match = sig.match(/^([^()]+)\s*\(([^)]*)\)\s*(view|pure)?/);

                if (match) {

                  const inputs = match[2].split(',').map(t => t.trim()).filter(t => t);

                  return {

                    name: name,

                    type: 'function',

                    inputs: inputs.map(t => ({ name: '', type: t })),

                    outputs: []

                  };

                } else {

                  // Fallback: treat as a function with no inputs

                  return {

                    name: name,

                    type: 'function',

                    inputs: [],

                    outputs: []

                  };

                }

              } else if (typeof sig === 'object' && sig !== null) {

                // Already an object with name, type, inputs, etc.

                return {

                  name: name,

                  type: sig.type || 'function',

                  inputs: Array.isArray(sig.inputs) ? sig.inputs : [],

                  outputs: Array.isArray(sig.outputs) ? sig.outputs : []

                };

              } else {

                return null;

              }

            }).filter(func => func !== null);

            

            if (template.abi.length === 0) {

              throw new Error('Failed to convert object ABI to array format');

            }

          } else {

            throw new Error('ABI is not in a recognized format');

          }

          

          // Extract function selectors from ABI

          template.abi.forEach(func => {

            if (func.name && func.type === 'function') {

              const selector = getFunctionSelector(func);

              if (selector) {

                template.function_selectors[func.name] = selector;

              }

            }

          });

        } catch (e) {

          template.notes.push(`Could not parse ABI: ${e.message}`);

        }

      }

    }

  } catch (e) {

    template.notes.push(`Error reading adapter: ${e.message}`);

  }



  // Add common DeFi function selectors

  template.function_selectors = {

    ...COMMON_FUNCTION_SELECTORS,

    ...template.function_selectors

  };



  // Generate calldata for ALL functions in the ABI

  if (template.abi && template.abi.length > 0) {

    template.calldata = {};

    

    // Generate calldata for every function

    template.abi.forEach(func => {

      if (func.type === 'function') {

        // Prepare dummy arguments based on function signature

        const dummyArgs = (func.inputs || []).map(input => {

          if (input.type === 'address') {

            return '0x0000000000000000000000000000000000000000';

          } else if (input.type === 'uint256' || input.type === 'uint256[]') {

            return '0x10000000000000000'; // 1 in wei

          } else if (input.type === 'bool') {

            return true;

          } else if (input.type === 'bytes32') {

            return '0x0000000000000000000000000000000000000000000000000000000000000000';

          } else {

            // For other types, use a default value

            return '0x0000000000000000000000000000000000000000000000000000000000000000';

          }

        });

        

        // Generate calldata

        const calldata = generateCalldata(func, dummyArgs);

        if (calldata) {

          template.calldata[func.name] = calldata;

        }

      }

    });

    

    console.log(`[INFO] Generated calldata for ${contract.protocol_slug_slug}`);

  } else if (template.notes.length === 0) {

    // No ABI found and no notes, add a note

    template.notes.push('No ABI found in adapter file');

  }



  return template;

}



/**

 * Get function selector from ABI

 */

function getFunctionSelector(func) {

  try {

    // Construct function signature: name(typename,...)

    const inputs = (func.inputs || []).map(input => input.type).join(',');

    const signature = `${func.name}(${inputs})`;

    

    // Keccak256 hash and take first 4 bytes

    const hash = require('crypto').createHash('keccak256').update(signature).digest('hex');

    return hash.substring(0, 8);

  } catch (e) {

    return null;

  }

}



/**

 * Generate calldata

 */

function generateCalldata(func, args) {


function generateCalldata(func, args) {
  try {
    const inputs = (func.inputs || []).map((input, index) => ({
      name: input.name || `arg${index}`,
      type: input.type,
      value: args[index] !== undefined ? args[index] : getDefaultCalldataValue(input.type, index, func.name)
    }));

    // Encode parameters
    let calldata = '';
    inputs.forEach(input => {
      if (input.type === 'address') {
        const value = input.value || '0x' + '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
        calldata += `0x${value.substring(2).padStart(64, '0')}`;
      } else if (input.type === 'uint256') {
        const num = input.value !== undefined ? parseInt(input.value) : 1000000000000000000;
        calldata += `0x${num.toString(16).padStart(64, '0')}`;
      } else if (input.type === 'int256') {
        const num = input.value !== undefined ? parseInt(input.value) : 0;
        calldata += `0x${num.toString(16).padStart(64, '0')}`;
      } else if (input.type === 'bool') {
        const val = input.value !== undefined ? (input.value === true || input.value === 'true' ? 1 : 0) : 1;
        calldata += `0x${val.toString(16).padStart(64, '0')}`;
      } else if (input.type.startsWith('bytes')) {
        const val = input.value || '';
        calldata += `0x${val.substring(2).padStart(64, '0')}`;
      } else if (input.type.startsWith('string')) {
        const val = input.value || 'ETH';
        const bytes = Buffer.from(val, 'utf8');
        calldata += `0x${bytes.toString('hex').padStart(64, '0')}`;
      } else {
        console.log(`[WARN] Using default calldata for unknown type: ${input.type}`);
        calldata += `0x${'00'.repeat(64)}`;
      }
    });

    return calldata;
  } catch (e) {
    console.log(`Error generating calldata for ${func.name}: ${e.message}`);
    return null;
  }
}

function getDefaultCalldataValue(type, index, funcName) {
  if (type === 'address') {
    return '0x' + '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  } else if (type === 'uint256') {
    if (funcName && (funcName.includes('transfer') || funcName.includes('deposit') || funcName.includes('swap'))) {
      return 1000000000000000000;
    }
    return 0;
  } else if (type === 'int256') {
    return 0;
  } else if (type === 'bool') {
    return true;
  } else if (type.startsWith('bytes')) {
    return '';
  } else if (type.startsWith('string')) {
    return 'ETH';
  } else {
    return '';
  }
}


  }


/**

 * Main execution

 */

function main() {

  console.log(`Generating enhanced calldata templates for ${contracts.length} contracts...`);

  

  const templates = [];

  let successCount = 0;

  let errorCount = 0;

  

  // Process each contract

  contracts.forEach((contract, index) => {

    try {

      const template = generateCalldataTemplate(contract);

      templates.push(template);

      successCount++;

      console.log(`[${index + 1}/${contracts.length}] Generated template for ${contract.protocol_slug_slug} (${contract.chain_name})`);

    } catch (error) {

      console.error(`[${index + 1}/${contracts.length}] Error generating template for ${contract.protocol_slug}:`, error.message);

      errorCount++;

    }

  });

  

  // Create output directory

  const outputDir = path.join(__dirname, 'output', 'calldata-templates');

  if (!fs.existsSync(outputDir)) {

    fs.mkdirSync(outputDir, { recursive: true });

  }

  

  // Save individual templates

  templates.forEach((template, index) => {

    const filename = `${template.protocol}-${template.chain_name.replace(/\s+/g, '-')}.json`.toLowerCase();

    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(template, null, 2));

  });

  

  // Save combined template

  const combinedPath = path.join(outputDir, 'all-contracts-calldata.json');

  fs.writeFileSync(combinedPath, JSON.stringify(templates, null, 2));

  

  // Save summary

  const summary = {

    total_contracts: contracts.length,

    templates_generated: successCount,

    errors: errorCount,

    timestamp: new Date().toISOString(),

    output_directory: outputDir

  };

  fs.writeFileSync(path.join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2));

  

  console.log(`\n✅ Enhanced Calldata template generation complete!`);

  console.log(`📁 Output directory: ${outputDir}`);

  console.log(`📊 Summary: ${successCount} templates generated, ${errorCount} errors`);

  console.log(`📝 Combined template: all-contracts-calldata.json`);

}



// Run the generator

main();
