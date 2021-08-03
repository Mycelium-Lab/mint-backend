
import { MongoClient } from 'mongodb'
const url = 'mongodb://localhost:27017';
const mongoClient = new MongoClient(url);

const storeToDB = async (dbName, collectionName, data) => {
    try{
        await mongoClient.connect();
        const db = mongoClient.db(dbName);
        const collection = db.collection(collectionName);
        await collection.insertMany(data);
    }finally {
        await mongoClient.close();
    }
}
const find = async (dbName, collectionName,request, options = {}) => {
    try{
        await mongoClient.connect();
        const db = mongoClient.db(dbName);
        const collection = db.collection(collectionName);
        const findResult = await collection.find(request, options).toArray();
        return findResult;
    }finally {
        await mongoClient.close();
    }
}
const findOne = async (dbName, collectionName,request, options = {}) => {
    try{
        await mongoClient.connect();
        const db = mongoClient.db(dbName);
        const collection = db.collection(collectionName);
        const findeOneResult = await collection.findOne(request, options);
        return findeOneResult;
    }finally {
        await mongoClient.close();
    }
}
const deleteOne = async (dbName, collectionName,request, options = {}) => {
    try{
        await mongoClient.connect();
        const db = mongoClient.db(dbName);
        const collection = db.collection(collectionName);
        const deleteOneRes = await collection.deleteOne(request, options);
        return deleteOneRes;
    }finally {
        await mongoClient.close();
    }
}
export default {
    storeToDB: storeToDB,
    find: find,
    findOne: findOne,
    deleteOne: deleteOne
}