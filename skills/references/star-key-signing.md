# StarKey signing reference

Use the canonical example in the SDK repository:

`examples/starkey-deploy.ts`

## Rules

- Build the payload with `@hoglet/sdk`.
- Serialize arguments and the transaction with `supra-l1-sdk`.
- Send the hex-encoded BCS transaction through `window.starkey.supra.sendTransaction`.
- `window.starkey.supra.connect()` returns `string[] | null`; handle rejection.
- `getChainId()` can return `null`; handle it.
- `sendTransaction()` can return `null` when the user rejects; handle it.
- `HexString.fromUint8Array(rawTxBytes).hex()` produces the hex string for `data`.
- `createRawTransactionData` is deprecated; do not use it.

## Final submission shape

```ts
const txHash = await supraProvider.sendTransaction({
  from: senderAccount,
  to: "",
  value: "",
  data: HexString.fromUint8Array(rawTxBytes).hex(),
  chainId,
  options: { waitForTransaction: true },
});

if (!txHash) throw new Error("Transaction rejected by the user");
```

The complete flow is:

1. `resolveConfig({ network })` and `new HogletTx(config)`.
2. Build the payload with the appropriate SDK module.
3. `supraProvider.connect()` and guard the account.
4. `supraProvider.getChainId()` and guard the chain ID.
5. `SupraClient.init(config.rpcV1)` and `getAccountInfo(senderHex)`.
6. Parse `payload.function` and `payload.typeArguments`.
7. BCS-serialize `payload.functionArguments` according to the Move signature.
8. `createSerializedRawTxObject(...)`.
9. `sendTransaction(...)` and guard the hash.

Always serialize each Move argument according to its type (u64, string, address, etc.).
