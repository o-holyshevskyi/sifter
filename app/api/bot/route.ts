import { Bot, webhookCallback } from 'grammy';
import { supabase } from '@/src/lib/db';
import { URL } from 'url';

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

bot.command('add', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const url = ctx.match.trim();

    if (!url) {
        await ctx.reply('Invalid format. Use: /add <url>');
        return;
    }

    try {
        new URL(url);
    } catch (error) {
        await ctx.reply('This is not a valid URL. Try again.');
        return;
    }

    const { data: source, error: sourceError } = await supabase
        .from('sources')
        .upsert({ url, type: 'rss' }, { onConflict: 'url' })
        .select('id')
        .single();

    if (sourceError || !source) {
        console.error('Source insert error:', sourceError);
        await ctx.reply('Database rejected this source. Internal error.');
        return;
    }

    const { error: subError } = await supabase
        .from('user_subscriptions')
        .insert({ user_id: userId, source_id: source.id });

    if (subError) {
        if (subError.code === '23505') {
            await ctx.reply('You are already subscribed to this feed. Do not spam.');
            return;
        }
        console.error('Subscription error:', subError);
        await ctx.reply('Failed to link source to your profile.');
        return;
    }

    await ctx.reply('Source accepted. I will monitor it.');
});

export const POST = webhookCallback(bot, 'std/http');
