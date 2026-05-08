const inferChainFromProtocol = (function() {
  // Extract just the function from the file
  const fs = require('fs');
  const content = fs.readFileSync('./scripts/extract-addresses.js', 'utf8');
  
  // Find the function
  const start = content.indexOf('function inferChainFromProtocol(');
  if (start === -1) throw new Error('Function not found');
  const openBrace = content.indexOf('{', start);
  let braceCount = 0;
  let endPos = -1;
  for (let i = openBrace; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    else if (content[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endPos = i;
        break;
      }
    }
  }
  if (endPos === -1) throw new Error('Could not find closing brace');
  
  // Create a standalone function
  const functionCode = content.substring(start, endPos + 1);
  const fn = new Function('protocolSlug', functionCode + 'return inferChainFromProtocol(protocolSlug);');
  return fn;
})();

// Test cases
const testCases = [
  { input: 'solana', expected: 'solana' },
  { input: 'phantom', expected: 'solana' },
  { input: 'raydium', expected: 'solana' },
  { input: 'orca', expected: 'solana' },
  { input: 'aave', expected: 'ethereum' },
  { input: 'uniswap', expected: 'ethereum' },
  { input: 'compound', expected: 'ethereum' },
  { input: 'curve', expected: 'ethereum' },
  { input: 'balancer', expected: 'ethereum' },
  { input: 'sushiswap', expected: 'ethereum' },
  { input: 'dydx', expected: 'ethereum' },
  { input: 'maker', expected: 'ethereum' },
  { input: 'dai', expected: 'ethereum' },
  { input: 'yearn', expected: 'ethereum' },
  { input: 'lido', expected: 'ethereum' },
  { input: 'arbitrum', expected: 'arbitrum' },
  { input: 'optimism', expected: 'optimism' },
  { input: 'polygon', expected: 'polygon' },
  { input: 'base', expected: 'base' },
  { input: 'linea', expected: 'linea' },
  { input: 'tron', expected: 'tron' },
  { input: 'just', expected: 'tron' },
  { input: 'bitcoin', expected: 'bitcoin' },
  { input: 'stacks', expected: 'bitcoin' },
  { input: 'cosmos', expected: 'cosmos' },
  { input: 'osmosis', expected: 'cosmos' },
  { input: 'thorchain', expected: 'cosmos' },
  { input: 'secret', expected: 'cosmos' },
  { input: 'kava', expected: 'cosmos' },
  { input: 'injective', expected: 'cosmos' },
  { input: 'phantom', expected: 'solana' },
  { input: 'pancakeswap', expected: 'solana' }, // cross-chain
  { input: 'xdai', expected: 'xdai' },
  { input: 'gnosis', expected: 'xdai' },
  { input: 'avalanche', expected: 'avax' },
  { input: 'celo', expected: 'celo' },
  { input: 'fantom', expected: 'fantom' },
  { input: 'heco', expected: 'heco' },
  { input: 'okt', expected: 'okt' },
  { input: 'zksync', expected: 'zksync' },
  { input: 'pulsechain', expected: 'pulsechain' },
  { input: 'shiden', expected: 'shiden' },
  { input: 'sora', expected: 'sora' },
  { input: 'tomo', expected: 'tomo' },
  { input: 'wanchain', expected: 'wanchain' },
  { input: 'mode', expected: 'mode' },
  { input: 'scroll', expected: 'scroll' },
  { input: 'zkevm', expected: 'zkevm' },
  { input: 'opbnb', expected: 'opbnb' },
  { input: 'op', expected: 'optimism' },
  { input: 'unknown-protocol', expected: null },
  { input: 'some-random-thing', expected: null },
];

console.log("Testing inferChainFromProtocol function...");
let passed = 0;
let failed = 0;

for (const test of testCases) {
  try {
    const result = inferChainFromProtocol(test.input);
    if (result === test.expected) {
      console.log(`✓ ${test.input}: ${result}`);
      passed++;
    } else {
      console.log(`✗ ${test.input}: expected ${test.expected}, got ${result}`);
      failed++;
    }
  } catch (e) {
    console.log(`✗ ${test.input}: error - ${e.message}`);
    failed++;
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);