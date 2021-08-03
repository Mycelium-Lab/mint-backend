import { MongoClient } from 'mongodb'
import mintTableConfig from '../config/mint-table.config.js';
const mongoClient = new MongoClient(mintTableConfig.url);
const getLiquidityProviders = async (filter, options = {}) => {
    try{
        await mongoClient.connect();
        const db = mongoClient.db(mintTableConfig.databaseName);
        const collection = db.collection(mintTableConfig.collectionName);
        const findResult = await collection.find(filter, options).toArray();
        return findResult;
    }finally {
        await mongoClient.close();
    }
}
const getLiquidityProvider = async (filter, options = {}) => {
    try{
        await mongoClient.connect();
        const db = mongoClient.db(mintTableConfig.databaseName);
        const collection = db.collection(mintTableConfig.collectionName);
        const findResult = await collection.findOne(filter, options);
        return findResult;
    }finally {
        await mongoClient.close();
    }
}
export default {
    getLiquidityProviders: getLiquidityProviders,
    getLiquidityProvider: getLiquidityProvider
}