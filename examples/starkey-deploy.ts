import { resolveConfig } from "@hoglet/core";
import { HogletTx } from "@hoglet/sdk";
import { SupraClient, HexString, BCS } from "supra-l1-sdk";
import { TypeTagParser } from "supra-l1-sdk-core";

// Minimal TypeScript definitions for StarKey injected browser provider
export interface StarKeySupraProvider {
  connect(): Promise<string[] | null>;
  getChainId(): Promise<number | string | null>;
  sendTransaction(params: {
    from: string;
    to: string;
    value: string;
    data: string;
    chainId: string;
    options?: { waitForTransaction: boolean };
  }): Promise<string | null>;
}

declare global {
  interface Window {
    starkey?: {
      supra?: StarKeySupraProvider;
    };
  }
}

/**
 * Complete and type-safe workflow for building a Hoglet transaction and submitting
 * it through StarKey wallet on Supra using official supra-l1-sdk imports.
 */
export async function deployExampleTokenWithStarKey(): Promise<string> {
  // 1. Resolve configuration and generate transaction payload
  const config = resolveConfig({ network: "testnet" });
  const hoglet = new HogletTx(config);

  const payload = hoglet.launcher.deployToken({
    raising: 1000000000000n, // u64 raw base units
    name: "Example Token",
    symbol: "TKN",
    uri: "https://example.com/metadata/tkn.json",
    quoteAddress: config.contracts.wsup, // Canonical quote token (Wrapped SUPRA)
  });

  // 2. Connect to StarKey Wallet with defensive validation
  const supraProvider = typeof window !== "undefined" ? window.starkey?.supra : undefined;
  if (!supraProvider) {
    throw new Error("StarKey wallet is not installed in the browser");
  }

  const accounts = await supraProvider.connect();
  const senderAccount = accounts?.[0];
  if (!senderAccount) {
    throw new Error("Connection rejected or no active accounts");
  }

  const rawChainId = await supraProvider.getChainId();
  if (!rawChainId) {
    throw new Error("Could not retrieve active network chain ID");
  }
  const chainId = String(rawChainId);

  // 3. Initialize SupraClient and query sequence number
  const supraClient = await SupraClient.init(config.rpcV1);
  const senderHex = HexString.ensure(senderAccount);
  const accountInfo = await supraClient.getAccountInfo(senderHex);

  // 4. Parse Move function parts with guard for noUncheckedIndexedAccess
  const parts = payload.function.split("::");
  const moduleAddress = parts[0];
  const moduleName = parts[1];
  const functionName = parts[2];

  if (!moduleAddress || !moduleName || !functionName) {
    throw new Error(`Invalid Move function signature: ${payload.function}`);
  }

  const parsedTypeTags = payload.typeArguments.map((tag: string) =>
    new TypeTagParser(tag).parseTypeTag()
  );

  // 5. Validate argument count and serialize to BCS
  const args = payload.functionArguments;
  if (args.length !== 9) {
    throw new Error(`Expected 9 arguments for deployToken, received: ${args.length}`);
  }

  const serializedArgs: Uint8Array[] = [
    BCS.bcsSerializeUint64(BigInt(String(args[0]))),
    BCS.bcsSerializeStr(String(args[1])),
    BCS.bcsSerializeStr(String(args[2])),
    BCS.bcsSerializeStr(String(args[3])),
    BCS.bcsSerializeStr(String(args[4])),
    BCS.bcsSerializeStr(String(args[5])),
    BCS.bcsSerializeStr(String(args[6])),
    HexString.ensure(String(args[7])).toUint8Array(),
    BCS.bcsSerializeUint64(BigInt(String(args[8]))),
  ];

  // 6. Build raw transaction bytes in BCS
  const rawTxBytes = await supraClient.createSerializedRawTxObject(
    senderHex,
    accountInfo.sequence_number,
    moduleAddress,
    moduleName,
    functionName,
    parsedTypeTags,
    serializedArgs
  );

  // 7. Send the transaction through StarKey provider
  const hexData = HexString.fromUint8Array(rawTxBytes).hex();

  const txHash = await supraProvider.sendTransaction({
    from: senderAccount,
    to: "",
    value: "",
    data: hexData,
    chainId,
    options: {
      waitForTransaction: true,
    },
  });

  if (!txHash) {
    throw new Error("Transaction was rejected or cancelled by user");
  }

  return txHash;
}
