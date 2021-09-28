import { URL } from 'url';

import { Cluster, clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import {
  AggregatorState,
  OracleJob,
  parseAggregatorAccountData,
  parseOracleJobAccountData,
} from '@switchboard-xyz/switchboard-api';
import prompts, { PromptObject } from 'prompts';

const questions: PromptObject[] = [
  {
    type: 'text',
    name: 'address',
    message: 'What is the Public Key of the Data Feed Account?',
  },
  {
    type: 'text',
    name: 'name',
    message: 'What is the name of the Data Feed?',
    initial: '',
  },
  {
    type: 'text',
    name: 'description',
    message: 'Short description of the Data Feed',
    initial: '',
  },
  {
    type: 'multiselect',
    name: 'tags',
    message: 'Select the tags',
    choices: [
      { title: 'Stablecoin', value: 'Stablecoin' },
      { title: 'LP Token', value: 'LP Token' },
      { title: 'NFT', value: 'NFT' },
    ],
  },
];

interface FeedInfo {
  name?: string;
  shortName?: string;
  description?: string;
  address?: string;
  optimizedAddress?: string;
  jobs?: string[];
  tags?: string[];
  minConfirmation?: number | null;
  minUpdateDelay?: number | null;
}

function toCluster(cluster: string): Cluster {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
    case 'mainnet-beta': {
      return cluster;
    }
  }
  throw new Error('Invalid cluster provided.');
}

async function main() {
  const cluster = 'mainnet-beta';
  const url = clusterApiUrl(toCluster(cluster), true);
  const connection = new Connection(url, 'processed');

  const { address, name, description, tags } = await prompts(questions);
  const dataFeed = new PublicKey(address);

  const agg: AggregatorState = await parseAggregatorAccountData(
    connection,
    dataFeed
  );
  const feed: FeedInfo = {
    name: name,
    shortName: name,
    address: address,
    description: description,
    jobs: [],
    tags: tags,
    minConfirmation: agg.configs?.minConfirmations,
    minUpdateDelay: agg.configs?.minUpdateDelaySeconds,
  };

  const jobs = await Promise.all(
    agg.jobDefinitionPubkeys
      .map((j) => new PublicKey(j))
      .map((job) => parseOracleJobAccountData(connection, job))
  );
  jobs.forEach((j) => {
    const first: OracleJob.ITask = j.tasks[0];
    const fetchTask:
      | OracleJob.IHttpTask
      | OracleJob.IWebsocketTask
      | null
      | undefined = 'httpTask' in first ? first.httpTask : null;
    if (fetchTask?.url && fetchTask.url !== null) {
      const url = new URL(fetchTask.url);
      feed.jobs?.push(url.hostname);
    }
  });

  console.log(JSON.stringify(feed, null, 2));
}

main().then(
  () => process.exit(),
  (err) => {
    console.error('Failed to complete action.');
    console.error(err);
    process.exit(-1);
  }
);
