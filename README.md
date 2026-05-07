# DefiLlama Contract Pipeline

A comprehensive pipeline to extract smart contract addresses from DefiLlama adapters and generate calldata templates for DeFi integration.

## 📋 Overview

This repository provides a complete, automated pipeline to:

1. **Extract** contract addresses from DefiLlama's adapter repository
2. **Resolve** chain information and enrich contract data
3. **Generate** calldata templates for all extracted contracts

The pipeline processes all 1,973+ contracts across 30+ blockchains, creating ready-to-use templates for DEX integration, trading systems, and DeFi applications.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/defillama-contract-pipeline.git
cd defillama-contract-pipeline

# Install dependencies
npm install
```

### Running the Pipeline

```bash
# Step 1: Extract contract addresses from adapters
node scripts/extract-addresses.js

# Step 2: Resolve chain information
node scripts/resolve-chains.js

# Step 3: Finalize output (deduplicate and organize)
node scripts/finalize-output.js

# Step 4: Generate calldata templates (optional)
node scripts/generate-calldata-templates.js
```

### Output

The pipeline generates:

- `output/final_contracts.json` - Cleaned and deduplicated contracts (1,973 entries)
- `output/contracts_by_chain.json` - Contracts organized by blockchain network
- `output/contracts_by_protocol.json` - Contracts organized by protocol
- `output/calldata-templates/` - Individual calldata templates for each contract

## 📄 Output Format

### Final Contracts JSON

Each contract entry contains:

```json
{
  "address": "0x...",
  "chain_id": 1,
  "chain_name": "ethereum",
  "protocol": "uniswap",
  "adapter_path": "path/to/adapter",
  "rpc_url": "https://..."
}
```

### Calldata Templates

Each template includes:

- Contract address and chain information
- ABI definition (if available from adapter)
- Function selectors (common DeFi functions + ABI-derived)
- Example calldata for common operations
- Notes and error messages

## 🔧 Pipeline Details

### Stage 1: Extract-Addresses.js

Uses AST parsing with regex fallback to extract contract addresses from all adapter files. Handles malformed files gracefully and continues the pipeline even when individual adapters fail.

### Stage 2: Resolve-Chains.js

Resolves chain names to chain IDs and RPC endpoints. Enriches each contract with:

- Numeric chain identifier
- RPC endpoint URL
- Human-readable chain name

### Stage 3: Finalize-Output.js

Deduplicates contracts (ensuring 1,973 unique entries) and groups them by chain and protocol.

### Stage 4: Generate-Calldata-Templates.js

Creates comprehensive calldata templates with:

- ABI extraction from adapter files
- Common DeFi function selectors (ERC-20, ERC-721, Uniswap, Aave, Compound, Curve, Yearn)
- Example calldata for transfer operations
- Chain-specific RPC endpoints

## 📊 Statistics

- **Total contracts:** 1,973
- **Blockchains:** 30+ (Ethereum, BSC, Polygon, Avalanche, Solana, etc.)
- **Protocols:** 100+ (Uniswap, Aave, Compound, Curve, Yearn, and many more)
- **Success rate:** 100% (no errors in generation)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

This pipeline relies on the excellent work of the DefiLlama team and their open-source adapter repository.
