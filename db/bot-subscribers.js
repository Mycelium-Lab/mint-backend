import { MongoClient } from 'mongodb'
import botSubscribersConfig from '../config/bot-subscribers.config.js';
const mongoClient = new MongoClient(botSubscribersConfig.url);
const getSubscribers = async (filter, options = {}) => {
    try{
        await mongoClient.connect();
        const db = mongoClient.db(botSubscribersConfig.databaseName);
        const collection = db.collection(botSubscribersConfig.collectionName);
        const findResult = await collection.find(filter, options).toArray();
        return findResult;
    }finally {
        await mongoClient.close();
    }
}
const getSubscriber = async (filter, options = {}) => {
    try{
        await mongoClient.connect();
        const db = mongoClient.db(botSubscribersConfig.databaseName);
        const collection = db.collection(botSubscribersConfig.collectionName);
        const findResult = await collection.findOne(filter, options);
        return findResult;
    }finally {
        await mongoClient.close();
    }
}
const newSubscriber = async (data) =>{
    try{
        await mongoClient.connect();
        const db = mongoClient.db(botSubscribersConfig.databaseName);
        const collection = db.collection(botSubscribersConfig.collectionName);
        await collection.insertOne(data);
    }finally {
        await mongoClient.close();
    }
}
const deleteSubscriber = async (request, options = {}) => {
    try{
        await mongoClient.connect();
        const db = mongoClient.db(botSubscribersConfig.databaseName);
        const collection = db.collection(botSubscribersConfig.collectionName);
        const deleteOneRes = await collection.deleteOne(request, options);
        return deleteOneRes;
    }finally {
        await mongoClient.close();
    }
}
export default {
    getSubscribers: getSubscribers,
    newSubscriber: newSubscriber,
    getSubscriber: getSubscriber,
    deleteSubscriber: deleteSubscriber
}