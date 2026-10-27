# Hoglet Agent Skills

Ready-to-download skills for AI agents working with Hoglet on Supra.

These skills are orchestration guides. They do not sign transactions or hold keys. They use:

- `@hoglet/mcp-server@0.3.3` for read-only data.
- `@hoglet/core@0.2.3` and `@hoglet/sdk@0.2.4` for unsigned payloads.
- A wallet or backend signer for signing and submission.

## Included skills

| Skill | Use for |
| :--- | :--- |
| `hoglet-launcher` | Deploy tokens, curve buys/sells, migration, HODL |
| `hoglet-multisig` | Multisig creation, proposals, approvals, voting |
| `hoglet-vault` | Autonomous contracts, upgrades, admin transfer, renouncement |
| `hoglet-amm` | Swaps, quotes, liquidity, WSUP |
| `hoglet-governance` | DAOs, proposals, locks, gauges, treasury |
| `hoglet-farm` | Stake, unstake, harvest, pools, boosts |

Shared references live in `references/`:

- `safety.md`
- `networks.md`
- `star-key-signing.md`

## Install

### opencode

Copy the **entire contents of the zip**, including `references/`, into one of:

```text
.opencode/skills/
~/.config/opencode/skills/
```

The loader looks for `**/SKILL.md`.

### Claude Code / compatible agents

Copy the **entire contents of the zip**, including `references/`, into:

```text
~/.claude/skills/
```

### Manual use

Each skill is a `SKILL.md` with YAML frontmatter. The skills reference the shared `references/` folder via `../references/`; keep that folder alongside the skill folders. You can also paste a skill into an agent's system prompt, but copy the referenced files too.

## Prerequisites

```bash
npm install @hoglet/core@0.2.3 @hoglet/sdk@0.2.4
npx -y @hoglet/mcp-server@0.3.3
```

For the MCP server, set `HOGLET_NETWORK=mainnet` for mainnet. Testnet is the default.

## Safety

- MCP is read-only.
- The SDK never signs or stores keys.
- Never share a seed phrase or private key.
- Test on testnet first.
- Require explicit confirmation before any write.
- No financial advice or return promises.
- Do not mix unrelated brand or memecoin branding into Hoglet workflows.

## Validate and pack

```bash
pnpm skills:validate
pnpm skills:pack
```

The pack script writes `artifacts/hoglet-agent-skills.zip` and a SHA256 checksum. Generated artifacts are not committed. CI publishes them on `skills-v*` tags.

## Source

Canonical source: `https://github.com/hoglet-DAO/hoglet-sdk/tree/main/skills`

Documentation: `https://docs.hoglet.xyz/docs/developers/sdk` and `https://docs.hoglet.xyz/docs/developers/mcp`
