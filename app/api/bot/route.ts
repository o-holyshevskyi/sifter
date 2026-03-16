/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Bot, webhookCallback, InlineKeyboard } from 'grammy';
import { supabase } from '@/src/lib/db';
import { validateFeed } from '@/src/lib/rss';
import { URL } from 'url';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is missing in .env.local');

const bot = new Bot(token);

bot.catch((err) => {
    console.error('[Grammy] Unhandled error for update', JSON.stringify(err.ctx.update), err.error);
});

const PRESET_FEEDS: Record<string, { label: string; url: string }> = {
    preset_hn:      { label: 'Hacker News',  url: 'https://news.ycombinator.com/rss' },
    preset_tc:      { label: 'TechCrunch',   url: 'https://techcrunch.com/feed/' },
    preset_verge:   { label: 'The Verge',    url: 'https://www.theverge.com/rss/index.xml' },
    preset_openai:  { label: 'OpenAI Blog',  url: 'https://openai.com/blog/rss.xml' },
};

async function subscribeUserToFeed(userId: number, url: string): Promise<'added' | 'duplicate' | 'error'> {
    const { data: source, error: sourceError } = await supabase
        .from('sources')
        .upsert({ url, type: 'rss' }, { onConflict: 'url' })
        .select('id')
        .single();

    if (sourceError || !source) {
        console.error('Source insert error:', sourceError);
        return 'error';
    }

    const { error: subError } = await supabase
        .from('user_subscriptions')
        .insert({ user_id: userId, source_id: source.id });

    if (subError) {
        if (subError.code === '23505') return 'duplicate';
        console.error('Subscription error:', subError);
        return 'error';
    }

    return 'added';
}

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
        return;
    }

    const keyboard = new InlineKeyboard()
        .text('📰 Hacker News', 'preset_hn').row()
        .text('📱 TechCrunch', 'preset_tc').row()
        .text('💻 The Verge', 'preset_verge').row()
        .text('🧠 OpenAI Blog', 'preset_openai');

    await ctx.reply(
        'I am SifterAI. I score news 1–10 and trash the noise.\n\n' +
        'Send me any valid RSS link, OR pick a predefined feed below to test the magic instantly:',
        { reply_markup: keyboard }
    );
});

bot.on('callback_query:data', async (ctx) => {
    const userId = ctx.from.id;
    const data = ctx.callbackQuery.data;

    const preset = PRESET_FEEDS[data];
    if (!preset) {
        await ctx.answerCallbackQuery();
        return;
    }

    await ctx.answerCallbackQuery();

    const result = await subscribeUserToFeed(userId, preset.url);

    if (result === 'added') {
        await ctx.reply(`${preset.label} added. Scanning for 8/10+ signals...`);
    } else if (result === 'duplicate') {
        await ctx.reply(`You are already subscribed to ${preset.label}.`);
    } else {
        await ctx.reply(`Failed to add ${preset.label}. Internal error.`);
    }
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
    } catch {
        await ctx.reply('This is not a valid URL. Try again.');
        return;
    }

    await ctx.reply('Checking feed...');

    const isValid = await validateFeed(url);
    if (!isValid) {
        await ctx.reply('Could not parse this RSS feed. Make sure the URL points to a valid RSS/Atom feed and try again.');
        return;
    }

    const result = await subscribeUserToFeed(userId, url);

    if (result === 'added') {
        await ctx.reply('Source accepted. I will monitor it.');
    } else if (result === 'duplicate') {
        await ctx.reply('You are already subscribed to this feed. Do not spam.');
    } else {
        await ctx.reply('Database rejected this source. Internal error.');
    }
});

bot.command('list', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    let subs, error;
    try {
        ({ data: subs, error } = await supabase
            .from('user_subscriptions')
            .select('sources(id, url)')
            .eq('user_id', userId));
    } catch (err) {
        console.error('[list] Supabase threw:', err);
        await ctx.reply('Failed to fetch subscriptions. Try again later.');
        return;
    }

    if (error) {
        console.error('[list] Supabase error:', error);
    }

    if (error || !subs || subs.length === 0) {
        await ctx.reply('You have no active subscriptions.');
        return;
    }

    let msg = '📋 <b>Your Sources:</b>\n\n';
    subs.forEach((sub, index) => {
        // @ts-ignore - Supabase types can be tricky with joins
        msg += `${index + 1}. ${sub.sources.url}\n`;
    });
    msg += '\nTo remove a source, use /remove &lt;url&gt;';

    await ctx.reply(msg, {
        parse_mode: 'HTML',
        // disable_web_page_preview: true
    });
});

bot.command('remove', async (ctx) => {
    const userId = ctx.from?.id;
    const url = ctx.match.trim();

    if (!userId || !url) {
        await ctx.reply('Format: /remove <url>');
        return;
    }

    // Шукаємо ID джерела
    const { data: source } = await supabase.from('sources').select('id').eq('url', url).single();
    if (!source) {
        await ctx.reply('Source not found.');
        return;
    }

    // Видаляємо зв'язок
    const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .match({ user_id: userId, source_id: source.id });

    if (error) {
        await ctx.reply('Failed to remove subscription.');
    } else {
        await ctx.reply('✅ Source removed successfully.');
    }
});

const handleUpdate = webhookCallback(bot, 'std/http');

export const POST = async (req: Request) => {
    try {
        return await handleUpdate(req);
    } catch (err) {
        console.error('[Bot] Fatal error handling update:', err);
        return new Response('OK', { status: 200 });
    }
};
