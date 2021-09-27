import { fetch } from 'cross-fetch';

import feedlist from '../feeds/feedlist.json';

export enum ENV {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103
}

export interface FeedList {
  readonly name: string;
  readonly logoURI: string;
  readonly tags: { [tag: string]: TagDetails };
  readonly timestamp: string;
  readonly feeds: FeedInfo[];
}

export interface TagDetails {
  readonly name: string;
  readonly description: string;
}

export interface FeedExtensions {
  readonly website?: string;
  readonly bridgeContract?: string;
  readonly assetContract?: string;
  readonly address?: string;
  readonly explorer?: string;
  readonly twitter?: string;
  readonly github?: string;
  readonly medium?: string;
  readonly tgann?: string;
  readonly tggroup?: string;
  readonly discord?: string;
  readonly serumV3Usdt?: string;
  readonly serumV3Usdc?: string;
  readonly coingeckoId?: string;
  readonly imageUrl?: string;
  readonly description?: string;
}

export interface FeedInfo {
  readonly chainId: number;
  readonly address: string;
  readonly name: string;
  readonly decimals: number;
  readonly symbol: string;
  readonly logoURI?: string;
  readonly tags?: string[];
  readonly extensions?: FeedExtensions;
}

export type FeedInfoMap = Map<string, FeedInfo>;

export const CLUSTER_SLUGS: { [id: string]: ENV } = {
  'mainnet-beta': ENV.MainnetBeta,
  testnet: ENV.Testnet,
  devnet: ENV.Devnet
};

export class GitHubFeedListResolutionStrategy {
  repositories = [
    'https://raw.githubusercontent.com/solana-labs/feed-list/main/src/feeds/feedlist.json'
  ];

  resolve = () => {
    return queryJsonFiles(this.repositories);
  };
}

export class CDNFeedListResolutionStrategy {
  repositories = [
    'https://cdn.jsdelivr.net/gh/solana-labs/feed-list@main/src/feeds/feedlist.json'
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
          `@solana/feed-registry: falling back to static repository.`
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
  CDN = 'CDN'
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
    [Strategy.CDN]: new CDNFeedListResolutionStrategy()
  };

  resolve = async (
    strategy: Strategy = Strategy.CDN
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

  filterByChainId = (chainId: number | ENV) => {
    return new FeedListContainer(
      this.feedList.filter((item) => item.chainId === chainId)
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
