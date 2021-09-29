import fs from 'fs';

import test from 'ava';

import { CLUSTER_SLUGS, ENV, FeedListProvider, Strategy } from '../index';
import { FeedInfo } from '../types';

test('Feed list is filterable by a tag', async (t) => {
  const list = (await new FeedListProvider().resolve(Strategy.Static))
    .filterByChainId(ENV.MainnetBeta)
    .filterByTag('nft')
    .getList();

  t.false(list.some((item) => item.name === 'BTC/USD'));
});

test('Feed list is filterable by a quote symbol', async (t) => {
  const list = (await new FeedListProvider().resolve(Strategy.Static))
    .filterByChainId(ENV.MainnetBeta)
    .filterByQuoteSymbol('SOL')
    .getList();

  t.true(list.some((item) => item.name === 'SOL/USD'));
  t.false(list.some((item) => item.name.includes('BTC')));
});

test('Feed list can exclude by a tag', async (t) => {
  const list = (await new FeedListProvider().resolve(Strategy.Static))
    .filterByChainId(ENV.MainnetBeta)
    .excludeByTag('nft')
    .getList();

  t.false(list.some((item) => item.tags === ['nft']));
});

test('Feed list can exclude by a chain', async (t) => {
  const list = (await new FeedListProvider().resolve(Strategy.Static))
    .excludeByChainId(ENV.MainnetBeta)
    .getList();

  t.false(list.some((item) => item.chainId === ENV.MainnetBeta));
});

test('Feed list returns new object upon filter', async (t) => {
  const list = await new FeedListProvider().resolve(Strategy.Static);
  const filtered = list.filterByChainId(ENV.MainnetBeta);
  t.true(list !== filtered);
  t.true(list.getList().length !== filtered.getList().length);
});

test('Feed list throws error when calling filterByClusterSlug with slug that does not exist', async (t) => {
  const list = await new FeedListProvider().resolve(Strategy.Static);
  const error = await t.throwsAsync(
    async () => list.filterByClusterSlug('whoop'),
    { instanceOf: Error }
  );
  t.is(
    error.message,
    `Unknown slug: whoop, please use one of ${Object.keys(CLUSTER_SLUGS)}`
  );
});

test('Feed list is a valid json', async (t) => {
  t.notThrows(() => {
    const content = fs.readFileSync('./src/feeds/feedlist.json').toString();
    JSON.parse(content.toString());
  });
});

test('Feed list does not have duplicate entries', async (t) => {
  const list = await new FeedListProvider().resolve(Strategy.Static);
  list
    .filterByChainId(ENV.MainnetBeta)
    .getList()
    .reduce((agg, item) => {
      if (agg.has(item.feedAddress)) {
        console.log(item.feedAddress);
      }

      t.false(agg.has(item.feedAddress));
      agg.set(item.feedAddress, item);
      return agg;
    }, new Map<string, FeedInfo>());
});
