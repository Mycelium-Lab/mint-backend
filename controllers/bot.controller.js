import botSubscribers from '../db/bot-subscribers.js';
import liquidityProviders from '../db/luquidity-providers.js';
const subscribe = async (ctx) => {
    try {
        let subscriber = await botSubscribers.getSubscriber({ username: ctx.message.from.username });
        if (subscriber) {
            ctx.reply('Already subscribed!');
        } else {
            //await db.storeToDB('telegram-bot-subscribers', 'subscribers', );
            await botSubscribers.newSubscriber({ username: ctx.message.from.username, id: ctx.message.from.id, first_name: ctx.message.from.first_name });
            ctx.reply('Subscribed!');
        }
    } catch (err) {
        ctx.reply('Error when dealing with subscribtion!');
        console.log(err);
    }
}
const onStart = (ctx) => {
    ctx.reply('Send /subscribe to get notifications about uniswap top liquidity providers actions. Send /address to get USD liquidity amount of specific address.')
}
const unsubscribe = async (ctx) => {
    try {
        let subscriber = await botSubscribers.getSubscriber({ username: ctx.message.from.username });
        if (subscriber) {
            await botSubscribers.deleteSubscriber({ username: ctx.message.from.username });
            ctx.reply('Unsubscribed!');
        } else {
            ctx.reply('You aren\'t subscribed!');
        }
    } catch (err) {
        ctx.reply('Error when dealing with subscribtion!');
        console.log(err);
    }
}
const fetchLiquidityByAddress = async (ctx) => {
    try {
        let address = ctx.message.text.match(/\/address (0x[a-fA-F0-9]{40})/);
        if (address) {
            let liquidityProvider = await liquidityProviders.getLiquidityProvider({ address: address[1].toLowerCase() });
            if (liquidityProvider) {
                ctx.reply(`${address[1].toLowerCase()} address has ${Math.floor(liquidityProvider.totalAmount)}$ liquidity!`);
            }
            else
                ctx.reply('No info about this address!')
        } else {
            ctx.reply('Error: Invalid address!');
        }
    } catch (err) {
        ctx.reply('Error: Problem with getting value from database.');
        console.log(err);
    }
}
export default {
    subscribe: subscribe,
    onStart: onStart,
    fetchLiquidityByAddress: fetchLiquidityByAddress,
    unsubscribe: unsubscribe
}