import { ReaderContext } from "./context.js";

/** `dao_tokens::smart_token` safety reads (tax / blacklist / initialization). */
export class TokenSafetyReader extends ReaderContext {
  private smartToken(fn: string): string {
    return `${this.config.contracts.daoTokens}::smart_token::${fn}`;
  }

  async isSmartToken(tokenAddress: string): Promise<boolean> {
    const raw = await this.safeViewOne(this.smartToken("is_initialized"), [
      tokenAddress,
    ]);
    return raw === true;
  }

  async isTaxActive(tokenAddress: string): Promise<boolean> {
    const raw = await this.safeViewOne(this.smartToken("is_tax_active"), [
      tokenAddress,
    ]);
    return raw === true;
  }

  /** Signature follows the module: `(token_address, account)`. */
  async isBlacklisted(
    tokenAddress: string,
    account: string,
  ): Promise<boolean> {
    const raw = await this.safeViewOne(this.smartToken("is_blacklisted"), [
      tokenAddress,
      account,
    ]);
    return raw === true;
  }
}
