export interface FeedList {
  readonly name: string;
  readonly description: string;
  readonly tags: { [tag: string]: TagDetails };
  readonly timestamp: string;
  readonly feeds: FeedInfo[];
}

export interface TagDetails {
  readonly name: string;
  readonly description: string;
}

// export const enum CurrencyPairType {
//   Fiat = 'Fiat',
//   Solana = 'Solana',
//   Stablecoin = 'Stablecoin',
//   SplToken = 'SplToken',
//   WrappedToken = 'WrappedToken',
//   NFT = 'NFT',
//   Other = 'Other',
// }

// export type CurrencyPairType =
// | 'Fiat'
// | 'Solana'
// | 'Stablecoin'
// | 'SplToken'
// | 'WrappedToken'
// | 'NFT'
// | 'Other';

export interface CurrencyPair {
  readonly type: string;
  readonly name: string;
  readonly symbol: string;
  readonly mintAddress?: string;
}

export interface FeedInfo {
  readonly name: string;
  readonly description?: string;
  readonly chainId: number;
  readonly feedAddress: string;
  readonly optimizedFeedAddress: string;
  readonly quotePair?: CurrencyPair;
  readonly basePair?: CurrencyPair;
  readonly tags?: string[];
}
