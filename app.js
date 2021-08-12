import './env.js'
import fs from 'fs'
import {Telegraf} from 'telegraf'
import botController from './controllers/bot.controller.js';
import poolEventsSubscriber from './services/pool-events-subscriber.service.js';
import menuMiddleware from './middlewares/menu.js';
import botSubscribers from './db/bot-subscribers.js';

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(menuMiddleware.middleware())
// Стартовое сообщение
bot.start(botController.onStart)
// При получении /address ищет в БД документ по адресу. Если находит, то отправляет количество ликвидности.
bot.command('address', botController.fetchLiquidityByAddress)
bot.command('menu', async (ctx) => {
  let subscriber = await botSubscribers.getSubscriber({ username: ctx.message.from.username }, { projection: { subscriptions: 1} });
  if(subscriber){
    ctx.session = {
      subscriptions : subscriber.subscriptions
    }
  }
  await menuMiddleware.replyToContext(ctx)
})
const tlsOptions = {
  key: fs.readFileSync('/etc/ssl/private/private-nodejs.key'),
  cert: fs.readFileSync('/etc/ssl/certs/public-nodejs.pem')
};
//bot.telegram.setWebhook(`https://${process.env.WEBHOOK_URI}:8443/bot`)
bot.startWebhook(`/bot`, tlsOptions, 8443);

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

//await poolEventsSubscriber.subscribeToPoolEvents(bot);
