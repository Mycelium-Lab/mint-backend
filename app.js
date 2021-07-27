import fetch from 'node-fetch';
import { MongoClient } from 'mongodb'
import { ApolloClient, HttpLink, gql } from '@apollo/client/core/core.cjs.js';
import { InMemoryCache } from '@apollo/client/cache/cache.cjs.js';

const url = 'mongodb://localhost:27017';
const mongoClient = new MongoClient(url);
const dbName = 'mint-table';
const collectionName = 'liquidity-providers';

const connectToDB = async (data) => {
    await mongoClient.connect();
    console.log('Connected successfully to server');
    const db = mongoClient.db(dbName);
    const collection = db.collection(collectionName);
    const insertResult = await collection.insertMany(data);
}

const mintsQuery = gql`
query GetMint($timestamp: Int!, $amount: String!) {
  mints(first:1000, where: {amountUSD_gt: $amount, timestamp_gt: $timestamp}, orderBy: origin, orderDirection: desc) {
    timestamp
    origin
    amountUSD
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
const noDup = (data) => { // форматирует запрос их массива событий mint в объект с id кошелька в качетсве ключа
    //console.log(data.mints);          // Если хочешь сохранить свою психику даже не пытайся разобраться
    let newObject = {};
    data.mints.map(element => {
      if (!(element.origin in newObject)) {
        newObject[element.origin] = {totalAmount:parseFloat(0),data:[], active:0, length:0};
      }
      newObject[element.origin].totalAmount = newObject[element.origin].totalAmount + parseFloat(element.amountUSD); 
      newObject[element.origin].active +=1;
      newObject[element.origin].length +=1;
  
      newObject[element.origin].data.push({ // я предупреждал
        date:element.timestamp,
        token0: element.token0.symbol,
        token1: element.token1.symbol,
        amountUSD: element.amountUSD,
        flag: 1
      })
  
      for (let burn of element.transaction.burns) {
        //console.log(element.to);
        newObject[element.origin].length +=1;
        if ((parseFloat(element.amountUSD) - parseFloat(burn.amountUSD)) < parseFloat(1000)) {
          newObject[element.origin].active -= 1;
          //console.log(parseFloat(element.amountUSD) - parseFloat(burn.amountUSD));
        }
        
        newObject[element.origin].data.push({
        date: burn.timestamp,
        token0: burn.token0.symbol,
        token1: burn.token1.symbol,
        amountUSD: burn.amountUSD,
        flag: 0
      })
      }
    });
    return newObject;
  }
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
const { loading, error, data, refetch, networkStatus }= await client.query({ query: mintsQuery , variables: mintsParameters});
let mintsObject = noDup(data);
const mintsToArray = Object.keys(mintsObject).map((addressKey) => {
    return {
        address: addressKey, 
        totalAmount: mintsObject[addressKey].totalAmount, 
        active: mintsObject[addressKey].active, 
        length: mintsObject[addressKey].length, 
        data: mintsObject[addressKey].data
    };
});
await connectToDB(mintsToArray);
