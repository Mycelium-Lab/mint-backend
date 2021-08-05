
import liquidityProviders from '../db/luquidity-providers.js';

const onStart = (ctx) => {
    ctx.reply('Send /menu to open top liquidity providers subscription menu. Send /address 0x0000000000000000000000000000000000000000 to get USD liquidity amount of specific address.')
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
    onStart: onStart,
    fetchLiquidityByAddress: fetchLiquidityByAddress,
}