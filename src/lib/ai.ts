import OpenAI from "openai";

const openAi = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY,
});

export const scorePostWithAi = async (title: string, content: string) => {
    const prompt = `
        You are a ruthless technical editor. Your job is to filter information noise for Senior Developers and Tech Entrepreneurs.
        Analyze this news item:
        Title: "${title}"
        Content: "${content}"

        CRITICAL RULES FOR SCORING (1 to 10):
        1. If the "Content" is missing, useless, or just says "Comments", evaluate STRICTLY based on the "Title".
        2. DO NOT use safe middle scores like 4, 5, 6, or 7. You must take a stand. Use 8-10 for critical signals, and 1-3 for noise.
        3. Score 8-10 (CRITICAL SIGNAL): Paradigm shifts, major tech releases (Next.js, OpenAI, Apple), critical zero-day vulnerabilities, massive funding rounds, or ground-breaking AI research.
        4. Score 1-3 (NOISE/TRASH): Generic tutorials, "Show HN" pet projects, local politics (e.g., "Drone strikes"), clickbait, opinion pieces, or generic lists.

        Write EXACTLY ONE sentence (maximum 15 words) in English explaining WHY it is a signal or WHY it is trash.

        Return the result STRICTLY as a JSON object:
        {"score": 9, "summary": "Major industry shift."}
    `;

            try {
                const response = await openAi.chat.completions.create({
                    model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.2
        });
        
        const resultText = response.choices[0].message.content;
        if (!resultText) throw new Error('Empty response from AI');

        const parsed = JSON.parse(resultText);

        return {
            score: typeof parsed.score === 'number' ? parsed.score : 1,
            summary: parsed.summary || 'Failed to generate summary.',
        }
    } catch (error) {
        console.error('AI Scoring Error:', error);
        return { score: 1, summary: 'AI analysis failed.' };
    }
}