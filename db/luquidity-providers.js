import { MongoClient } from 'mongodb'
import mintTableConfig from '../config/mint-table.config.js';
import mintTableV2Config from '../config/mint-tableV2.config.js';
const mongoClient = new MongoClient(mintTableConfig.url);
const mongoClientV2 = new MongoClient(mintTableConfig.url);
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
const getLiquidityProvidersV2 = async (filter, options = {}) => {
    try{
        await mongoClientV2.connect();
        const db = mongoClientV2.db(mintTableV2Config.databaseName);
        const collection = db.collection(mintTableV2Config.collectionName);
        const findResult = await collection.find(filter, options).toArray();
        return findResult;
    }finally {
        await mongoClientV2.close();
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
const getLiquidityProviderV2 = async (filter, options = {}) => {
    try{
        await mongoClientV2.connect();
        const db = mongoClientV2.db(mintTableV2Config.databaseName);
        const collection = db.collection(mintTableV2Config.collectionName);
        const findResult = await collection.findOne(filter, options);
        return findResult;
    }finally {
        await mongoClientV2.close();
    }
}
export default {
    getLiquidityProviders: getLiquidityProviders,
    getLiquidityProvider: getLiquidityProvider,
    getLiquidityProviderV2: getLiquidityProviderV2,
    getLiquidityProvidersV2: getLiquidityProvidersV2
}