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

export interface FeedInfo {
  readonly chainId: number;
  readonly feedAddress: string;
  readonly optimizedFeedAddress: string;
  readonly quoteSplAddress?: string;
  readonly name: string;
  readonly description?: string;
  readonly tags?: string[];
  readonly jobs?: string[];
}
