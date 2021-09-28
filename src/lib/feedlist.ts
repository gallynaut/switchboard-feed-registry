import { fetch } from 'cross-fetch';

import feedlist from '../feeds/feedlist.json';
import { FeedInfo, FeedList } from '../types';

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
    'https://raw.githubusercontent.com/switchboardxyz/feed-list/main/src/feeds/feedlist.json',
  ];

  resolve = () => {
    return queryJsonFiles(this.repositories);
  };
}

export class CDNFeedListResolutionStrategy {
  repositories = [
    'https://cdn.jsdelivr.net/gh/switchboardxyz/feed-list@main/src/feeds/feedlist.json',
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
          `@switchboardxyz/feed-registry: falling back to static repository.`
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

  filterByJob = (job: string) => {
    return new FeedListContainer(
      this.feedList.filter((item) => (item.jobs || []).includes(job))
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
