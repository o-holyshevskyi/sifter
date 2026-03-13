import { Bot, webhookCallback } from 'grammy';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is missing in .env.local');

const bot = new Bot(token);

bot.command('start', async (ctx) => {
    await ctx.reply('Hello, I am yours goalkeeper. Throw me RSS link, and I will start filtering trash for you.');
});

bot.on('message:text', async (ctx) => {
    await ctx.reply(`You wrote: '${ctx.message.text}'. But my creator has not started developing me yet. Give him a couple of days.`);
});

export const POST = webhookCallback(bot, 'std/http');
