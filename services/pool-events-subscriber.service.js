import Web3 from "web3";
import fs from 'fs'
import luquidityProviders from '../db/luquidity-providers.js';
import botSubscribers from '../db/bot-subscribers.js';
// Функция посылает всем подписчикам бота сообщение о новом эвенте. 
const eventHandler = async (event, botInstance) => {
    try {
        let subscribers = await botSubscribers.getSubscribers({});
        if (subscribers.length > 0) {
            subscribers.forEach((subscriber) => {
                botInstance.telegram.sendMessage(subscriber.id, `${event.event} event. Owner: ${event.returnValues.owner}, amount: ${event.returnValues.amount}`);
            })
        }
    } catch (err) {
        console.log(err);
    }
}
const subscribeToPoolEvents = async (botInstance) => {
    const contractJson = fs.readFileSync('./abi/IUniswapV3PoolEvents.json');
    const poolEventsAbi = JSON.parse(contractJson);
    const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://rinkeby.infura.io/ws/v3/' + process.env.INFURA_API_KEY));
    

    // Сделать запрос к БД и сохранить в массив адреса пулов без дубликатов 
    const liquidityProvidersQuery = await luquidityProviders.getLiquidityProviders({}, { projection: { address: 1, pools: 1, _id: 0 } })

    let pools = []
    for (let query of liquidityProvidersQuery) {
        for (let pool of query.pools) {
            if (!pools.includes(pool)) {
                pools.push(pool)
            }
        }
    }
    let poolContracts = []
    pools.forEach((pool) => {
        poolContracts.push(new web3.eth.Contract(poolEventsAbi, pool))
    });

    const currentBlockNumber = await web3.eth.getBlockNumber();
    let options = {
        filter: {
            owner: liquidityProvidersQuery.map((query) => { return query.address }) // Отфильтровать эвенты по адресам из БД
        },
        fromBlock: currentBlockNumber
    };
    // Подписаться на эвенты всех пулов из массива
    poolContracts.forEach((pool, index) => {

        pool.events.Mint(options)
            .on("connected", function (subscriptionId) {
                console.log(`${index + 1}. Connected to ${pool.options.address} MINT events. Subscription ID: ${subscriptionId}`);
            })
            .on('data', async (event) => {
                await eventHandler(event, botInstance);
            })
        pool.events.Burn(options)
            .on("connected", function (subscriptionId) {
                console.log(`Connected to ${pool.options.address} BURN events. Subscription ID: ${subscriptionId}\n`);
            })
            .on('data', async (event) => {
                await eventHandler(event, botInstance);
            })
    })
    return poolContracts;
}
export default{
    subscribeToPoolEvents: subscribeToPoolEvents
}