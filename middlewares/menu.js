import {MenuTemplate, MenuMiddleware, createBackMainMenuButtons} from 'telegraf-inline-menu'
const menu = new MenuTemplate(() => 'Subscribe to get notifications about uniswap top liquidity providers actions (choose amount of liquidity):')
import botSubscribers from '../db/bot-subscribers.js'

menu.select('select', ['100.000+ $', '300.000+ $', '1.000.000+ $'], {
	set: async (ctx, key) => {
    let subscriber = await botSubscribers.getSubscriber({ username: ctx.update.callback_query.from.username }, { projection: { subscription_type: 1} });
    if(subscriber && subscriber.subscription_type === key){
      await ctx.answerCbQuery('Unsubscribed!')
      await botSubscribers.deleteSubscriber({ username: ctx.update.callback_query.from.username })
    }else{
      await ctx.answerCbQuery(`You subscribed to ${key} liquidity providers!`)
      ctx.session = {subscribtionType: key}
      let updateDoc = {
        id:ctx.update.callback_query.from.id,
        username:ctx.update.callback_query.from.username,
        first_name:ctx.update.callback_query.from.first_name,
        subscription_type:key
      }
      await botSubscribers.updateSubscriber({ username: ctx.update.callback_query.from.username }, updateDoc);
    }
		return true
	},
	isSet: async (ctx, key) => {
    if(ctx.session){
      return ctx.session.subscribtionType === key;
    }else{
      return false
    }
  }
})

export default new MenuMiddleware('/', menu)