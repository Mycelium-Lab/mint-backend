import { MenuTemplate, MenuMiddleware, createBackMainMenuButtons } from 'telegraf-inline-menu'
const menu = new MenuTemplate(() => 'Subscribe to get notifications about uniswap top liquidity providers actions (choose amount of liquidity):')
import botSubscribers from '../db/bot-subscribers.js'
const checkIfSubscribed = (subscribtionsArray, version) => {
  for (let subscribtion of subscribtionsArray) {
    if (subscribtion.version == version) {
      return true;
    }
  }
  return false;
}

menu.toggle('Uniswap v2', 'Uniswap v2', {
  set: async (ctx, newState) => {
    let subscriber = await botSubscribers.getSubscriber({ username: ctx.update.callback_query.from.username }, { projection: { subscriptions: 1 } });
    if (subscriber) {
      if (checkIfSubscribed(subscriber.subscriptions, 2)) {
        if (subscriber.subscriptions.length == 1) {
          await ctx.answerCbQuery(`Unsubscribed!`)
          await botSubscribers.deleteSubscriber({ username: ctx.update.callback_query.from.username })
        } else {
          let filteredSubscriptions = subscriber.subscriptions.filter((subscribtion) => subscribtion.version != 2)
          let updateDoc = {
            id: ctx.update.callback_query.from.id,
            username: ctx.update.callback_query.from.username,
            first_name: ctx.update.callback_query.from.first_name,
            subscriptions: filteredSubscriptions
          }
          ctx.session = {
            subscriprions: filteredSubscriptions
          }
          await botSubscribers.updateSubscriber({ username: ctx.update.callback_query.from.username }, updateDoc);
        }
      } else {
        subscriber.subscriptions.push({ type: "100.000+ $", version: 2 })
        let updateDoc = {
          id: ctx.update.callback_query.from.id,
          username: ctx.update.callback_query.from.username,
          first_name: ctx.update.callback_query.from.first_name,
          subscriptions: subscriber.subscriptions
        }
        ctx.session = {
          subscriptions : subscriber.subscriptions
        }
        await ctx.answerCbQuery(`Subscribed to Uniswap v2 events 100.000+ $ liquidity!`)
        await botSubscribers.updateSubscriber({ username: ctx.update.callback_query.from.username }, updateDoc);
      }
    } else {
      let updateDoc = {
        id: ctx.update.callback_query.from.id,
        username: ctx.update.callback_query.from.username,
        first_name: ctx.update.callback_query.from.first_name,
        subscriptions: [{
          type: '100.000+ $',
          version: 2
        }]
      }
      ctx.session = {
        subscriptions : [{
          type: '100.000+ $',
          version: 2
        }]
      }
      await ctx.answerCbQuery(`Subscribed to Uniswap v2 events 100.000+ $ liquidity!`)
      await botSubscribers.updateSubscriber({ username: ctx.update.callback_query.from.username }, updateDoc);
    }
    return true
  },
  isSet: (ctx) => {
    if(ctx.session && ctx.session.subscriptions){
      return checkIfSubscribed(ctx.session.subscriptions, 2);
    }else{
      return false;
    }
  }
})
const getSubscriptionType = (subscriptionsArray, version) => {
  for(let subscription of subscriptionsArray){
    if(subscription.version == version){
      return subscription.type;
    }
  }
}
menu.select('select', ['100.000+ $', '300.000+ $', '1.000.000+ $'], {
  hide: async (ctx) => {
    if(ctx.session && ctx.session.subscriptions){
      return !checkIfSubscribed(ctx.session.subscriptions, 2);
    }else{
      let username = ctx.message ? ctx.message.from.username : ctx.update.callback_query.from.username;
      let subscriber = await botSubscribers.getSubscriber({ username: username }, { projection: { subscriptions: 1} });
      if(subscriber && checkIfSubscribed(subscriber.subscriptions, 2))
        return false
      else
        return true
    }

  },

	set: async (ctx, key) => {
    let subscriber = await botSubscribers.getSubscriber({ username: ctx.update.callback_query.from.username }, { projection: { subscriptions: 1} });
    if (subscriber){
      if(getSubscriptionType(subscriber.subscriptions, 2)!=key){
        let newSubscriptionsArray = subscriber.subscriptions.map((subscription)=>{
          if(subscription.version == 2){
            return {
              version: subscription.version,
              type: key
            }
          }else{
            return subscription
          }
        })
        let updateDoc = {
          id: ctx.update.callback_query.from.id,
          username: ctx.update.callback_query.from.username,
          first_name: ctx.update.callback_query.from.first_name,
          subscriptions: newSubscriptionsArray
        }
        ctx.session = {
          subscriptions: newSubscriptionsArray
        }
        await ctx.answerCbQuery(`Subscription changed to ${key} liquidity!`)
        await botSubscribers.updateSubscriber({ username: ctx.update.callback_query.from.username }, updateDoc);
      }else{
        ctx.session = {
          subscriptions: subscriber.subscriptions
        }
    }
    }
		return true
	},
	isSet: async (ctx, key) => {
    if(ctx.session && ctx.session.subscriptions){
      return getSubscriptionType(ctx.session.subscriptions, 2) == key;
    }else{
      return false;
    }
  }
})
export default new MenuMiddleware('/', menu)