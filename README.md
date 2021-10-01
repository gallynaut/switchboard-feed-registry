# @switchboard-xyz/feed-registry

Forked from https://github.com/solana-labs/token-list. Temporary repository for testing


Switchboard Feed Registry is a package that allows application to query for list of tokens.
The JSON schema for the feed includes: chainId, name, feedAddress, optimizedFeedAddress, splAddress, tags (optional).

## Installation

```bash
npm install @gallynaut/switchboard-feed-registry
```

```bash
yarn add @gallynaut/switchboard-feed-registry
```

## Examples

### Query available tokens

```typescript
new FeedListProvider().resolve().then((feeds) => {
  const feedList = feeds
    .filterByClusterSlug('mainnet-beta')
    .filterByTag('usd-pair')
    .getList();
  console.log(feedList);
});
```

### Render data for feed in React

```typescript jsx
import React, { useEffect, useState } from 'react';
import { FeedListProvider, FeedInfo } from '@gallynaut/switchboard-feed-registry';


export const FeedCard = (props: { mint: string }) => {
  const [feedMap, setFeedMap] = useState<Map<string, FeedInfo>>(new Map());

  useEffect(() => {
    new FeedListProvider().resolve().then(tokens => {
      const feedList = tokens.filterByChainId(ENV.MainnetBeta).filterByTag('usd-pair').getList();

      setFeedMap(feedList.reduce((map, item) => {
        map.set(item.name, item);
        return map;
      },new Map()));
    });
  }, [setFeedMap]);

  const feed = feedMap.get(props.mint);
  if (!feed) return null;

  return (
    <div>
      <h1>{feed.name}</h1>
    </div>
  );

```

## Adding new token

Submit PR with changes to JSON file `src/feeds/feedlist.json`

# Disclaimer

All claims, content, designs, algorithms, estimates, roadmaps,
specifications, and performance measurements described in this project
are done with the Solana Foundation's ("SF") best efforts. It is up to
the reader to check and validate their accuracy and truthfulness.
Furthermore nothing in this project constitutes a solicitation for
investment.

Any content produced by SF or developer resources that SF provides, are
for educational and inspiration purposes only. SF does not encourage,
induce or sanction the deployment, integration or use of any such
applications (including the code comprising the Solana blockchain
protocol) in violation of applicable laws or regulations and hereby
prohibits any such deployment, integration or use. This includes use of
any such applications by the reader (a) in violation of export control
or sanctions laws of the United States or any other applicable
jurisdiction, (b) if the reader is located in or ordinarily resident in
a country or territory subject to comprehensive sanctions administered
by the U.S. Office of Foreign Assets Control (OFAC), or (c) if the
reader is or is working on behalf of a Specially Designated National
(SDN) or a person subject to similar blocking or denied party
prohibitions.

The reader should be aware that U.S. export control and sanctions laws
prohibit U.S. persons (and other persons that are subject to such laws)
from transacting with persons in certain countries and territories or
that are on the SDN list. As a project based primarily on open-source
software, it is possible that such sanctioned persons may nevertheless
bypass prohibitions, obtain the code comprising the Solana blockchain
protocol (or other project code or applications) and deploy, integrate,
or otherwise use it. Accordingly, there is a risk to individuals that
other persons using the Solana blockchain protocol may be sanctioned
persons and that transactions with such persons would be a violation of
U.S. export controls and sanctions law. This risk applies to
individuals, organizations, and other ecosystem participants that
deploy, integrate, or use the Solana blockchain protocol code directly
(e.g., as a node operator), and individuals that transact on the Solana
blockchain through light clients, third party interfaces, and/or wallet
software.
