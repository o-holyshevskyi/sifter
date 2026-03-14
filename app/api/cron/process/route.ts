import { NextResponse } from 'next/server';
import { supabase } from '@/src/lib/db';
import { scorePostWithAi } from '@/src/lib/ai';

export async function GET(req: Request) {
    console.log('--- STARTING AI PROCESSING ---');

    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        console.warn('Unauthorized cron attempt');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: posts, error: fetchError } = await supabase
        .from('posts')
        .select('id, title, content')
        .is('ai_score', null)
        .limit(5);

    if (fetchError || !posts) {
        return NextResponse.json({ error: 'Failed to fetch unprocessed posts' }, { status: 500 });
    }

    if (posts.length === 0) {
        return NextResponse.json({ message: 'No posts to process' });
    }

    let processedCount = 0;

    for (const post of posts) {
        const aiResult = await scorePostWithAi(post.title, post.content || '');
        
        const { error: updateError } = await supabase
            .from('posts')
            .update({
                ai_score: aiResult.score,
                ai_summary: aiResult.summary
            })
            .eq('id', post.id);

        if (!updateError) {
            processedCount++;
        } else {
            console.error(`Failed to update post ${post.id}:`, updateError);
        }
    }

    console.log(`--- AI PROCESSING COMPLETE. Processed: ${processedCount} posts ---`);
    return NextResponse.json({ success: true, processed: processedCount });
}