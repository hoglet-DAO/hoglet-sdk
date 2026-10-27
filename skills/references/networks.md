# Hoglet networks and versions

## Canonical versions

- `@hoglet/core@0.2.3`
- `@hoglet/sdk@0.2.4`
- `@hoglet/mcp-server@0.3.3`

## Networks

| Network | RPC v1 | Chain ID | Indexed APIs |
| :--- | :--- | :--- | :--- |
| Testnet | `https://rpc-testnet.supra.com` | `6` | Not supported |
| Mainnet | `https://rpc-mainnet.supra.com` | `8` | `api.hoglet.xyz`, `launch.hoglet.xyz`, `swap.hoglet.xyz`, `daos.hoglet.xyz` |

Deployed contract addresses are identical on testnet and mainnet by design. Only endpoints and chain IDs change.

## Common addresses

- Wrapped SUPRA (WSUP, canonical quote): `0x3db05342523bd72817b09f264761a7621eeb21d0960d9676ba5ce14651b17c43`
- Hoglet launcher (`hoglet_core`): `0xd6a0e979c0a05fadc1e545e0a445beb4de2dd33405f985948e0ea4a2abd89885`
- AMM router: `0x3045d27b5fada1e30897a741fb184e48ef0bff3717aea23918ebc1e5c7153083`

Use `resolveConfig({ network })` from `@hoglet/core` rather than hardcoding endpoints or addresses.

## MCP environment

```bash
HOGLET_NETWORK=mainnet npx -y @hoglet/mcp-server@0.3.3
```

The default MCP network is testnet.
