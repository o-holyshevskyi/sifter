import { NextResponse } from "next/server";
import { supabase } from "@/src/lib/db";
import { fetchFeedItems } from "@/src/lib/rss";

export async function GET(req: Request) {
    console.log('--- STARTING CRON FETCH ---');

    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn('Unauthorized cron attempt');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sources, error: sourcesError } = await supabase
        .from('sources')
        .select('id, url')
        .eq('type', 'rss');

    if (sourcesError || !sources) return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 });

    if (sources.length === 0) return NextResponse.json({ message: 'No sources to fetch' });

    let totalInserted = 0;

    for (const source of sources) {
        const items = await fetchFeedItems(source.url);

        const recentItems = items.slice(0, 10);

        for (const item of recentItems) {
            const { error: insertError } = await supabase
                .from('posts')
                .upsert({
                    source_id: source.id,
                    url: item.link,
                    title: item.title,
                    content: item.content,
                    published_at: item.pubDate,
                }, { onConflict: 'url', ignoreDuplicates: true });

            if (!insertError) totalInserted++;
        }
    }

    console.log(`--- CRON FETCH COMPLETE. Inserted: ${totalInserted} new posts ---`);
    return NextResponse.json({ success: true, inserted: totalInserted });
}