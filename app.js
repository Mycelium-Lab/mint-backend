import {Telegraf} from 'telegraf'
import botController from './controllers/bot.controller.js';
import poolEventsSubscriber from './services/pool-events-subscriber.service.js';
import webhookConfig from './config/webhook.config.js';
import menuMiddleware from './middlewares/menu.js';
import botSubscribers from './db/bot-subscribers.js';
const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(menuMiddleware.middleware())
// Стартовое сообщение
bot.start(botController.onStart)
// При получении /address ищет в БД документ по адресу. Если находит, то отправляет количество ликвидности.
bot.command('address', botController.fetchLiquidityByAddress)
bot.command('menu', async (ctx) => {
    let subscriber = await botSubscribers.getSubscriber({ username: ctx.message.from.username }, { projection: { subscription_type: 1} });
    if(subscriber){
      ctx.session = {subscribtionType: subscriber.subscription_type}
    }
    await menuMiddleware.replyToContext(ctx)
  })
  bot.launch({
    webhook: webhookConfig
  })
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

await poolEventsSubscriber.subscribeToPoolEvents(bot);
