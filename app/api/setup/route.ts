import { Bot } from 'grammy';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is missing');

const bot = new Bot(token);

export async function GET() {
    await bot.api.setMyCommands([
        { command: 'start',  description: 'Register and get started' },
        { command: 'add',    description: 'Subscribe to an RSS feed: /add <url>' },
        { command: 'list',   description: 'List your active subscriptions' },
        { command: 'remove', description: 'Unsubscribe from a feed: /remove <url>' },
    ]);

    return Response.json({ ok: true, message: 'Bot commands registered.' });
}
