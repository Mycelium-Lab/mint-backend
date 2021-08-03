import { Telegraf } from 'telegraf';
import botController from './controllers/bot.controller.js';
import poolEventsSubscriber from './services/pool-events-subscriber.service.js';
import webhookConfig from './config/webhook.config.js';
const bot = new Telegraf(process.env.BOT_TOKEN)
// Стартовое сообщение
bot.start(botController.onStart)
// При получении /subscribe ищет по username в БД. Если не находит, то добавляет. 
bot.command('subscribe', botController.subscribe)
// При получении /address ищет в БД документ по адресу. Если находит, то отправляет количество ликвидности.
bot.command('address', botController.fetchLiquidityByAddress)
bot.command('unsubscribe', botController.unsubscribe)
bot.launch({
    webhook: webhookConfig
  })
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

await poolEventsSubscriber.subscribeToPoolEvents(bot);
