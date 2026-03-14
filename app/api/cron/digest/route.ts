import { NextResponse } from 'next/server';
import { supabase } from '@/src/lib/db';
import { Bot } from 'grammy';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is missing');
const bot = new Bot(token);

export async function GET(req: Request) {
    console.log('--- STARTING DIGEST CRON ---');

    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn('Unauthorized cron attempt');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Беремо всіх користувачів
    const { data: users, error: usersError } = await supabase.from('users').select('telegram_id');
    if (usersError || !users || users.length === 0) {
        return NextResponse.json({ message: 'No users found' });
    }

    let sentCount = 0;
    const sentPostIds = new Set<number>();

    for (const user of users) {
        // 2. Беремо джерела, на які підписаний цей юзер
        const { data: subs } = await supabase
            .from('user_subscriptions')
            .select('source_id')
            .eq('user_id', user.telegram_id);

        if (!subs || subs.length === 0) continue;
        const sourceIds = subs.map(s => s.source_id);

        // 3. Беремо ТІЛЬКИ ВАЖЛИВІ новини (8+) для цих джерел, які ще не надсилались
        const { data: posts } = await supabase
            .from('posts')
            .select('id, title, url, ai_score, ai_summary')
            .in('source_id', sourceIds)
            .gte('ai_score', 8)
            .is('digest_sent_at', null)
            .order('ai_score', { ascending: false });

        // Якщо нічого важливого не сталось — не турбуємо юзера. Це і є "Тиша".
        if (!posts || posts.length === 0) {
            console.log(`No critical updates for user ${user.telegram_id}`);
            continue;
        }

        // 4. Формуємо гарне повідомлення. Використовуємо HTML, щоб не ламалось від спецсимволів у заголовках
        let message = `🔥 <b>Your Daily Signal</b> 🔥\n<i>Found ${posts.length} critical updates for you.</i>\n\n`;

        posts.forEach(post => {
            // Очищуємо HTML-теги з тайтлів, якщо вони там є
            const cleanTitle = post.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            message += `<b>[${post.ai_score}/10]</b> <a href="${post.url}">${cleanTitle}</a>\n`;
            message += `💡 <i>${post.ai_summary}</i>\n\n`;
        });

        // 5. Відправляємо в Telegram
        try {
            await bot.api.sendMessage(user.telegram_id, message, {
                parse_mode: 'HTML',
                // disable_web_page_preview: true // Щоб не було величезних прев'ю посилань на півекрана
            });
            sentCount++;
            posts.forEach(post => sentPostIds.add(post.id));
        } catch (err) {
            console.error(`Failed to send message to ${user.telegram_id}:`, err);
        }
    }

    // 6. Позначаємо всі надіслані пости як sent, щоб не дублювати в наступних дайджестах
    if (sentPostIds.size > 0) {
        await supabase
            .from('posts')
            .update({ digest_sent_at: new Date().toISOString() })
            .in('id', Array.from(sentPostIds));
    }

    console.log(`--- DIGEST COMPLETE. Sent to ${sentCount} users ---`);
    return NextResponse.json({ success: true, sent: sentCount });
}