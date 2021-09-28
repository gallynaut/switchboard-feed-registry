/*
Work in progress
The goal is to have a command line interface to easily
add new feeds to the common json file
*/
import { URL } from 'url';

import { Cluster, clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import {
  AggregatorState,
  OracleJob,
  parseAggregatorAccountData,
  parseOracleJobAccountData,
} from '@switchboard-xyz/switchboard-api';
import prompts, { PromptObject } from 'prompts';

import { CLUSTER_SLUGS } from '../lib/feedlist';
import { FeedInfo } from '../types';

const questions: PromptObject[] = [
  {
    type: 'select',
    name: 'cluster',
    message: 'Solana network?',
    choices: [
      {
        title: 'Mainnet-Beta',
        value: 'mainnet-beta',
      },
      { title: 'Devnet', value: 'devnet' },
    ],
    initial: 0,
  },
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
  const { cluster, address, name, description, tags } = await prompts(
    questions
  );
  const chainId: number = CLUSTER_SLUGS[cluster];
  const url = clusterApiUrl(toCluster(cluster), true);
  const connection = new Connection(url, 'processed');
  const dataFeed = new PublicKey(address);
  const aggregatorAccount: AggregatorState = await parseAggregatorAccountData(
    connection,
    dataFeed
  );

  const endpoints = await getFeedEndpoints(connection, aggregatorAccount);
  const feed: FeedInfo = {
    chainId: chainId,
    name: name,
    feedAddress: address,
    optimizedFeedAddress: '',
    description: description,
    jobs: endpoints,
    tags: tags,
  };

  console.log(JSON.stringify(feed, null, 2));
  // Need to write it back to file when done
}

main().then(
  () => process.exit(),
  (err) => {
    console.error('Failed to complete action.');
    console.error(err);
    process.exit(-1);
  }
);

async function getFeedEndpoints(
  connection: Connection,
  aggregatorAccount: AggregatorState
): Promise<string[]> {
  const jobEndpoints: string[] = [];

  const jobs: OracleJob[] = await Promise.all(
    aggregatorAccount.jobDefinitionPubkeys
      .map((j) => new PublicKey(j))
      .map((job) => parseOracleJobAccountData(connection, job))
  );
  jobs.forEach((j) => {
    const firstTask: OracleJob.ITask = j.tasks[0];
    const url = getUrl(firstTask);
    if (url) {
      jobEndpoints.push(url);
    }
  });
  return jobEndpoints;
}

function getUrl(task: OracleJob.ITask): string | null {
  if (task.httpTask?.url) {
    const url = new URL(task.httpTask?.url);
    return url.hostname;
  } else if (task.websocketTask?.url) {
    const url = new URL(task.websocketTask?.url);
    return url.hostname;
  }
  return null;
}
