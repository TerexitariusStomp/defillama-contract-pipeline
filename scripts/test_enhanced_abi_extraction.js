
const { extractABIFromAdapterWithHelpers } = require('./generate-calldata-templates-enhanced');

// Test on a few helper-based adapters
const testAdapters = [
  { name: 'tornadocore', path: '/home/terexitarius/.hermes/defillama-repos/DefiLlama-Adapters/projects/tornadocore/index.js' },
  { name: 'wisdomtree', path: '/home/terexitarius/.hermes/defillama-repos/DefiLlama-Adapters/projects/wisdomtree/index.js' },
  { name: 'artura', path: '/home/terexitarius/.hermes/defillama-repos/DefiLlama-Adapters/projects/artura/index.js' },
  { name: 'dyson', path: '/home/terexitarius/.hermes/defillama-repos/DefiLlama-Adapters/projects/dyson/index.js' },
  { name: 'zyfai', path: '/home/terexitarius/.hermes/defillama-repos/DefiLlama-Adapters/projects/zyfai/ethereum.js' }
];

testAdapters.forEach(adapter => {
  console.log("\n--- Testing:", adapter.name, "---");
  const abi = extractABIFromAdapterWithHelpers(adapter.path);
  if (abi.length > 0) {
    console.log(`✅ Success! Extracted ${abi.length} functions`);
    const funcNames = abi.slice(0, 3).map(f => f.name);
    console.log("    Functions:", funcNames.join(', '));
  } else {
    console.log("❌ No ABI found");
  }
});
