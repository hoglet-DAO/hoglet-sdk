import test from "node:test";
import assert from "node:assert/strict";
import {
  CONTRACTS,
  HogletReader,
  NETWORKS,
  resolveConfig,
} from "../dist/index.js";

test("contract addresses are centralized and complete", () => {
  const expected = {
    daoFactory: "0xe7ebc7fa1e5d6ce8a102780dd22577a5f8bc9cdb9de7c9fb250176b017f25fcd",
    daoRouter: "0x81d6612bb40d99e79fa99114a82953a3a19971b37b147ea269ce4a535288fbb8",
    daoGenesis: "0x7ea1513782150d8c19896dd9da91215d7b81d10ad4c0ae1467167b6c8834d037",
    daoBoost: "0x0893f46752ea8ee1416cf061c2f0ffd4ff538020630731c4e96074f3d64e0107",
    daoLibs: "0xc91177c0c283292d8de2a1be69926d904d055bc8ae758a2a2958e7508121a30e",
    daoTokens: "0x195047fcb6bb4c2918ab5c61e08a777a575bc2f32116bfc40bbed49c04a13bf8",
    daoScripts: "0x739eb15a8beb2660db940041b5c29e96270feb2ee77eecb023877f22cee977e9",
    daoViews: "0xf3f3650ace9d98102b7023c61c1f6c5a698008ded9662585faf069c4810cb24e",
    taxRouter: "0x74329c1fd2d57b2a902f737b5ad71b4610214635de74b8dbeb82be9b1a985493",
    launcher: "0xd6a0e979c0a05fadc1e545e0a445beb4de2dd33405f985948e0ea4a2abd89885",
    ammRouter: "0x3045d27b5fada1e30897a741fb184e48ef0bff3717aea23918ebc1e5c7153083",
    wsup: "0x3db05342523bd72817b09f264761a7621eeb21d0960d9676ba5ce14651b17c43",
    vault: "0x06dc465fc9c70df95df1e1c0b1fb44d72d70a2f0479dd8ee8158e79e8a6f171a",
    multisigV2: "0xe7572de52f8b92f88b7164558369cf1da822dc0842b652364d7278999cdcd64c",
    multisigLegacy: "0x5d7f79da44885dfd543f81139cff25fb43121e7ae03ebd720f9ac9e6449dd1a5",
    nftWrapper: "0x2926688850d36e736b1b80bdafaafffba51da5e8cac98d721380e70f0f568d56",
  };
  assert.deepEqual({ ...CONTRACTS }, expected);
});

test("networks only change endpoints, not contracts", () => {
  const testnet = resolveConfig({ network: "testnet" });
  const mainnet = resolveConfig({ network: "mainnet" });
  assert.equal(testnet.chainId, 6);
  assert.equal(mainnet.chainId, 8);
  assert.deepEqual({ ...testnet.contracts }, { ...mainnet.contracts });
  assert.equal(mainnet.indexApiBase, "https://daos.hoglet.xyz");
});

test("reader keeps flat API and exposes modules", () => {
  const reader = new HogletReader(resolveConfig({ network: "mainnet" }));
  assert.equal(typeof reader.getDaoStatus, "function");
  assert.equal(typeof reader.vault.getContractControl, "function");
  assert.equal(typeof reader.multisig.getUserMultisigs, "function");
  assert.equal(reader.config.network, "mainnet");
});

test("byte helpers encode Move vectors", async () => {
  const { toBytesHex, toBytesHexList } = await import("../dist/index.js");
  assert.equal(toBytesHex("abc"), "0x616263");
  assert.deepEqual(toBytesHexList([new Uint8Array([1, 2])]), ["0x0102"]);
});
