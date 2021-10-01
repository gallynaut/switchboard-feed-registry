import { fetch } from 'cross-fetch';

import feedlist from '../feeds/feedlist.json';

export type FeedInfoMap = Map<string, FeedInfo>;

export enum ENV {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103,
}

export const CLUSTER_SLUGS: { [id: string]: ENV } = {
  'mainnet-beta': ENV.MainnetBeta,
  testnet: ENV.Testnet,
  devnet: ENV.Devnet,
};

export class GitHubFeedListResolutionStrategy {
  repositories = [
    'https://raw.githubusercontent.com/gallynaut/switchboard-feed-registry/main/src/feeds/feedlist.json',
  ];

  resolve = () => {
    return queryJsonFiles(this.repositories);
  };
}

export class CDNFeedListResolutionStrategy {
  repositories = [
    'https://cdn.jsdelivr.net/gh/gallynaut/switchboard-feed-registry@main/src/feeds/feedlist.json',
  ];

  resolve = () => {
    return queryJsonFiles(this.repositories);
  };
}

const queryJsonFiles = async (files: string[]) => {
  const responses: FeedList[] = (await Promise.all(
    files.map(async (repo) => {
      try {
        const response = await fetch(repo);
        const json = (await response.json()) as FeedList;
        return json;
      } catch {
        console.info(
          `@gallynaut/switchboard-feed-registry: falling back to static repository.`
        );
        return feedlist;
      }
    })
  )) as FeedList[];

  return responses
    .map((feedlist: FeedList) => feedlist.feeds)
    .reduce((acc, arr) => (acc as FeedInfo[]).concat(arr), []);
};

export enum Strategy {
  GitHub = 'GitHub',
  Static = 'Static',
  Solana = 'Solana',
  CDN = 'CDN',
}

export class SolanaFeedListResolutionStrategy {
  resolve = () => {
    throw new Error(`Not Implemented Yet.`);
  };
}

export class StaticFeedListResolutionStrategy {
  resolve = () => {
    return feedlist.feeds;
  };
}

export class FeedListProvider {
  static strategies = {
    [Strategy.GitHub]: new GitHubFeedListResolutionStrategy(),
    [Strategy.Static]: new StaticFeedListResolutionStrategy(),
    [Strategy.Solana]: new SolanaFeedListResolutionStrategy(),
    [Strategy.CDN]: new CDNFeedListResolutionStrategy(),
  };

  resolve = async (
    strategy: Strategy = Strategy.Static
  ): Promise<FeedListContainer> => {
    return new FeedListContainer(
      await FeedListProvider.strategies[strategy].resolve()
    );
  };
}

export class FeedListContainer {
  constructor(private feedList: FeedInfo[]) {}

  filterByTag = (tag: string) => {
    return new FeedListContainer(
      this.feedList.filter((item) => (item.tags || []).includes(tag))
    );
  };

  filterByUsdBasePair = () => {
    return new FeedListContainer(
      this.feedList.filter(
        (item) =>
          item.basePair?.type === 'Fiat' && item.basePair?.symbol === 'USD'
      )
    );
  };

  filterByQuoteSymbol = (querySymbol: string) => {
    return new FeedListContainer(
      this.feedList.filter((item) => item.quotePair?.symbol === querySymbol)
    );
  };

  filterByChainId = (chainId: number | ENV) => {
    return new FeedListContainer(
      this.feedList.filter((item) => item.chainId === chainId)
    );
  };

  filterByName = (query: string) => {
    return new FeedListContainer(
      this.feedList.filter((item) => item.name.includes(query))
    );
  };

  filterByNameStartsWith = (query: string) => {
    return new FeedListContainer(
      this.feedList.filter((item) => item.name.startsWith(query))
    );
  };

  excludeByChainId = (chainId: number | ENV) => {
    return new FeedListContainer(
      this.feedList.filter((item) => item.chainId !== chainId)
    );
  };

  excludeByTag = (tag: string) => {
    return new FeedListContainer(
      this.feedList.filter((item) => !(item.tags || []).includes(tag))
    );
  };

  filterByClusterSlug = (slug: string) => {
    if (slug in CLUSTER_SLUGS) {
      return this.filterByChainId(CLUSTER_SLUGS[slug]);
    }
    throw new Error(
      `Unknown slug: ${slug}, please use one of ${Object.keys(CLUSTER_SLUGS)}`
    );
  };

  getList = () => {
    return this.feedList;
  };
}

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
