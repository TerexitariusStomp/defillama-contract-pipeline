
const { generateCalldataTemplate } = require('./generate-calldata-templates');

// Test on a few contracts with explicit ABI definitions
const testContracts = [
  {
    protocol_slug: 'tokemak',
    adapter_file: 'projects/tokemak/index.js',
    address: '0x5f7a8c9c3f8d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
    chain_id: 1,
    chain_name: 'Ethereum'
  },
  {
    protocol_slug: 'onchaingm',
    adapter_file: 'projects/onchaingm/index.js',
    address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    chain_id: 1,
    chain_name: 'Ethereum'
  }
];

testContracts.forEach(contract => {
  console.log("\n--- Testing:", contract.protocol_slug, "---");
  try {
    const template = generateCalldataTemplate(contract);
    if (template.abi && template.abi.length > 0) {
      console.log(`✅ Success! Generated ABI with ${template.abi.length} functions`);
      const funcNames = template.abi.slice(0, 3).map(f => f.name);
      console.log("    Functions:", funcNames.join(', '));
    } else {
      console.log("❌ No ABI found");
    }
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
  }
});
