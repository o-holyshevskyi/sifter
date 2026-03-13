import { Bot, webhookCallback } from 'grammy';
import { supabase } from '@/src/lib/db';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is missing in .env.local');

const bot = new Bot(token);

bot.command('start', async (ctx) => {
    const user = ctx.from;
    if (!user) return;

    const { error } = await supabase
        .from('users')
        .upsert({
            telegram_id: user.id,
            username: user.username || 'unknown',
            tier: 'free',
        }, { onConflict: 'telegram_id' });

    if (error) {
        console.log('Supabase error: ', error.message);
        await ctx.reply('System failure. My creator messed up the database connection.');
    }

    await ctx.reply('Welcome. I am your AI Gatekeeper. Send me an RSS feed link, and I will filter the noise for you.');
});

bot.on('message:text', async (ctx) => {
    await ctx.reply(`You wrote: '${ctx.message.text}'. But my creator has not started developing me yet. Give him a couple of days.`);
});

export const POST = webhookCallback(bot, 'std/http');
