import Web3 from "web3";
import fs from 'fs'
import luquidityProviders from '../db/luquidity-providers.js';
import botSubscribers from '../db/bot-subscribers.js';

// Функция посылает всем подписчикам бота сообщение о новом эвенте. 
const eventHandler = async (event, botInstance, web3) => {
    try {
        let liquidityProvider = await luquidityProviders.getLiquidityProviderV2({address: event.returnValues.sender.toLowerCase()}, {projection: { totalAmount: 1}});
        let subscribers;
        if (liquidityProvider.totalAmount >= 1000000){
            subscribers = await botSubscribers.getSubscribers({});
        }else if (liquidityProvider.totalAmount >= 300000){
            subscribers = await botSubscribers.getSubscribers({subscriptions: { $elemMatch: {type: {$in: ["100.000+ $", "300.000+ $"]}}}});
        } else if (liquidityProvider.totalAmount >= 100000){
            subscribers = await botSubscribers.getSubscribers({subscriptions: { $elemMatch: {type: "100.000+ $"}}});
        }
        if (subscribers.length > 0) {
            await Promise.all(subscribers.map((subscriber) => {
                return botInstance.telegram.sendMessage(subscriber.id, `A new "${event.event}" event occured! To address: ${event.returnValues.sender}. Amount: ${web3.utils.fromWei(event.returnValues.amount0)} and ${web3.utils.fromWei(event.returnValues.amount1)}. Transaction: ${'https://etherscan.io/tx/' + event.transactionHash}`);
            }))
        }
    } catch (err) {
        console.log(err);
    }
}
const subscribeToPairEvents = async (botInstance) => {
    const contractJson = fs.readFileSync('./abi/UniswapV2Pair.json');
    const pairAbi = JSON.parse(contractJson);
    const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://mainnet.infura.io/ws/v3/' + process.env.INFURA_API_KEY));
    

    // Сделать запрос к БД и сохранить в массив адреса пулов без дубликатов 
    const liquidityProvidersQuery = await luquidityProviders.getLiquidityProvidersV2({}, { projection: { address: 1, pairs: 1, _id: 0 } })

    let pairs = []
    for (let query of liquidityProvidersQuery) {
        for (let pair of query.pairs) {
            if (!pairs.includes(pair)) {
                pairs.push(pair)
            }
        }
    }
    let pairContracts = []
    pairs.forEach((pair) => {
        pairContracts.push(new web3.eth.Contract(pairAbi, pair))
    });
    console.log(liquidityProvidersQuery);
    const currentBlockNumber = await web3.eth.getBlockNumber();
    let options = {
        filter: {
            to: liquidityProvidersQuery.map((query) => { return query.address }) // Отфильтровать эвенты по адресам из БД
        },
        fromBlock: currentBlockNumber
    };
    // Подписаться на эвенты всех пулов из массива
    pairContracts.forEach((pair, index) => {

        // pair.events.Mint(options)
        //     .on("connected", function (subscriptionId) {
        //         console.log(`${index + 1}. Connected to ${pair.options.address} MINT events. Subscription ID: ${subscriptionId}`);
        //     })
        //     .on('data', async (event) => {
        //         await eventHandler(event, botInstance);
        //     })
        pair.events.Burn(options)
            .on("connected", function (subscriptionId) {
                console.log(`Connected to ${pair.options.address} BURN events. Subscription ID: ${subscriptionId}\n`);
            })
            .on('data', async (event) => {
                await eventHandler(event, botInstance, web3);
            })
    })
    return pairContracts;
}
// const subscribeToPoolEvents = async (botInstance) => {
//     const contractJson = fs.readFileSync('./abi/IUniswapV3PoolEvents.json');
//     const poolEventsAbi = JSON.parse(contractJson);
//     const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://mainnet.infura.io/ws/v3/' + process.env.INFURA_API_KEY));
    

//     // Сделать запрос к БД и сохранить в массив адреса пулов без дубликатов 
//     const liquidityProvidersQuery = await luquidityProviders.getLiquidityProviders({}, { projection: { address: 1, pools: 1, _id: 0 } })

//     let pools = []
//     for (let query of liquidityProvidersQuery) {
//         for (let pool of query.pools) {
//             if (!pools.includes(pool)) {
//                 pools.push(pool)
//             }
//         }
//     }
//     let poolContracts = []
//     pools.forEach((pool) => {
//         poolContracts.push(new web3.eth.Contract(poolEventsAbi, pool))
//     });

//     const currentBlockNumber = await web3.eth.getBlockNumber();
//     let options = {
//         filter: {
//             owner: liquidityProvidersQuery.map((query) => { return query.address }) // Отфильтровать эвенты по адресам из БД
//         },
//         fromBlock: currentBlockNumber
//     };
//     // Подписаться на эвенты всех пулов из массива
//     poolContracts.forEach((pool, index) => {

//         pool.events.Mint(options)
//             .on("connected", function (subscriptionId) {
//                 console.log(`${index + 1}. Connected to ${pool.options.address} MINT events. Subscription ID: ${subscriptionId}`);
//             })
//             .on('data', async (event) => {
//                 await eventHandler(event, botInstance);
//             })
//         pool.events.Burn(options)
//             .on("connected", function (subscriptionId) {
//                 console.log(`Connected to ${pool.options.address} BURN events. Subscription ID: ${subscriptionId}\n`);
//             })
//             .on('data', async (event) => {
//                 await eventHandler(event, botInstance);
//             })
//     })
//     return poolContracts;
// }
export default{
    //subscribeToPoolEvents: subscribeToPoolEvents,
    subscribeToPairEvents: subscribeToPairEvents
}
