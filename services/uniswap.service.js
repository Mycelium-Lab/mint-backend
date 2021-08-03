import { ApolloClient, HttpLink, gql } from '@apollo/client/core/core.cjs.js';
import { InMemoryCache } from '@apollo/client/cache/cache.cjs.js';
import fetch from 'node-fetch';
const mintsQuery = gql`
query GetMint($timestamp: Int!, $amount: String!) {
  mints(first:1000, where: {amountUSD_gt: $amount, timestamp_gt: $timestamp}, orderBy: origin, orderDirection: desc) {
    timestamp
    origin
    amountUSD
    pool{
        id
    }
  token0{
    symbol
  }
  token1{
    symbol
  }
    transaction {
      burns {
        amountUSD
        timestamp
        token0{
          symbol
        }
        token1{
          symbol
        }
      }
    }
  }
}
`
const today = new Date();
const yearAgo = new Date(today.getFullYear()-1, today.getMonth(), today.getDate()).getTime() / 1000;
const mintsParameters = {
    timestamp: parseInt(yearAgo),
    amount: "1000000"
}
const link = new HttpLink({
    uri: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
    fetch
  });


const client = new ApolloClient({
    link,
    cache: new InMemoryCache()
  });
export default {
  makeQuery: client.query({ query: mintsQuery , variables: mintsParameters});
}