import db from './db.js';
import { Telegraf } from 'telegraf';
import Web3 from "web3";
import fs from 'fs'

const bot = new Telegraf(process.env.BOT_TOKEN)
// Стартовое сообщение
bot.start((ctx) => {
    ctx.reply('Send /subscribe to get notifications about uniswap top liquidity providers actions. Send /address to get USD liquidity amount of specific address.')
})
// При получении /subscribe ищет по username в БД. Если не находит, то добавляет. 
bot.command('subscribe', async (ctx) => {
    try{
        let subscriber = await db.findOne('telegram-bot-subscribers', 'subscribers', {username: ctx.message.from.username});
        if(subscriber){
            ctx.reply('Already subscribed!');
        }else{
            await db.storeToDB('telegram-bot-subscribers', 'subscribers', [{username: ctx.message.from.username, id: ctx.message.from.id, first_name: ctx.message.from.first_name}]);
            ctx.reply('Subscribed!');
        }
    }catch(err){
        ctx.reply('Error when dealing with subscribtion!');
        console.log(err);
    }
})
// При получении /address ищет в БД документ по адресу. Если находит, то отправляет количество ликвидности.
bot.command('address', async (ctx) => {
    try{
        let address = ctx.message.text.match(/\/address (0x[a-fA-F0-9]{40})/);
        if(address){
            let liquidityProvider = await db.findOne('mint-table', 'liquidity-providers', {address: address[1].toLowerCase()});
            if(liquidityProvider){
                ctx.reply(`${address[1].toLowerCase()} address has ${Math.floor(liquidityProvider.totalAmount)}$ liquidity!`);
            }
            else
                ctx.reply('No info about this address!')
        }else{
            ctx.reply('Error: Invalid address!');
        }
    }catch(err)
    {
        ctx.reply('Error: Problem with getting value from database.');
        console.log(err);
    }
})
bot.command('unsubscribe', async (ctx) => {
    try{
        let subscriber = await db.findOne('telegram-bot-subscribers', 'subscribers', {username: ctx.message.from.username});
        if(subscriber){
            await db.deleteOne('telegram-bot-subscribers', 'subscribers', {username: ctx.message.from.username} )
            ctx.reply('Unsubscribed!');
        }else{
            ctx.reply('You aren\'t subscribed!');
        }
    }catch(err){
        ctx.reply('Error when dealing with subscribtion!');
        console.log(err);
    }
})
bot.launch({
    webhook: {
      domain: 'https://rare-vampirebat-98.loca.lt',
      port: 3000
    }
  })
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

const contractJson = fs.readFileSync('./abi/IUniswapV3PoolEvents.json');
const poolEventsAbi = JSON.parse(contractJson);
const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://rinkeby.infura.io/ws/v3/' + process.env.INFURA_API_KEY));
const currentBlockNumber = await web3.eth.getBlockNumber();

// Сделать запрос к БД и сохранить в массив адреса пулов без дубликатов 
const poolsQuery = await db.find('mint-table', 'liquidity-providers', {}, {projection: {address: 1, pools: 1, _id: 0}})

let pools = []
for (let query of poolsQuery) {
  for (let pool of query.pools){
    if(!pools.includes(pool)){
      pools.push(pool)
    }
  }
}
let poolContracts = []
pools.forEach((pool) => {
  poolContracts.push(new web3.eth.Contract(poolEventsAbi, pool))
});

// Функция посылает всем подписчикам бота сообщение о новом эвенте. 
const eventHandler = async (event) => {
    try{
        let subscribers = await db.find('telegram-bot-subscribers', 'subscribers', {});
        if(subscribers.length > 0){
            subscribers.forEach((subscriber) => {
                bot.telegram.sendMessage(subscriber.id, `${event.event} event. Owner: ${event.returnValues.owner}, amount: ${event.returnValues.amount}`);
            })
        }
    }catch(err){
        console.log(err);
    }
}
// Подписаться на эвенты всех пулов из массива
poolContracts.forEach((pool, index) => {
    let options = {
        filter: {
            owner: poolsQuery.map((query) => {return query.address}) // Отфильтровать эвенты по адресам из БД
        },
        fromBlock: currentBlockNumber
    };
    pool.events.Mint(options)
    .on("connected", function(subscriptionId){
        console.log(`${index + 1}. Connected to ${pool.options.address} MINT events. Subscription ID: ${subscriptionId}`);
    })
    .on('data', async (event) => {
       await eventHandler(event);
    })
    pool.events.Burn(options)
    .on("connected", function(subscriptionId){
        console.log(`Connected to ${pool.options.address} BURN events. Subscription ID: ${subscriptionId}`);
    })
    .on('data', async (event) =>{
        await eventHandler(event);
    })
})



// UNISWAP GRAPHQL REQUEST + STORE IN DB

// import utils from './utils.js'
// import makeQuery from './uniswap.js'
// const { loading, error, data, refetch, networkStatus } = await makeQuery();
// const mintsToArray = utils.converMintsToAddressArray(data);
// await db.storeToDB(mintsToArray);