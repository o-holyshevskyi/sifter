import Parser from "rss-parser";

const parser = new Parser({
    timeout: 5000
});

export const fetchFeedItems = async (url: string) => {
    try {
        const feed = await parser.parseURL(url);
        return feed.items.map(item => {
            const raw = (item.contentSnippet || item.content || '').trim();
            const content = raw.length > 30 ? raw : (item.title || '');
            return {
                title: item.title || 'Untitled',
                link: item.link || '',
                content,
                pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            };
        }).filter(item => item.link !== '');
    } catch (error) {
        console.error(`Failed to parse RSS at ${url}:`, error);
        return [];
    }
}