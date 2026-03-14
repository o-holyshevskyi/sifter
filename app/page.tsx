import Link from 'next/link';

export default function Home() {
  // Заміни на лінк свого бота
  const BOT_URL = "https://t.me/sifter_ai_bot";

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-emerald-500 selection:text-white font-sans">

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-sm text-neutral-400 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          AI Curator is live
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Stop reading garbage.<br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            Get the Signal.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-neutral-400 mb-10 max-w-2xl mx-auto">
          99% of your news feed is noise, clickbait, and marketing.
          Sift AI reads hundreds of RSS feeds while you sleep and delivers only the top 1% critical updates straight to your Telegram.
        </p>

        <Link
          href={BOT_URL}
          target="_blank"
          className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-lg px-8 py-4 rounded-xl transition-all hover:scale-105 active:scale-95"
        >
          Add to Telegram — It&apos;s Free
        </Link>
      </div>

      {/* How it Works Section */}
      <div className="border-t border-neutral-900 bg-neutral-950/50">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <h2 className="text-3xl font-bold text-center mb-16">How it ruthlessly filters your feed</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
              <div className="text-4xl mb-4">📥</div>
              <h3 className="text-xl font-semibold mb-2">1. Throw in your sources</h3>
              <p className="text-neutral-400">
                Send any RSS feed link to the bot. Hacker News, TechCrunch, indie blogs. We handle the pipeline.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🤖</div>
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold mb-2">2. AI reads everything</h3>
              <p className="text-neutral-400">
                Our GPT-4o-mini engine scores every article from 1 to 10. We instantly trash anything below an 8.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-emerald-900/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <div className="text-4xl mb-4">⚡️</div>
              <h3 className="text-xl font-semibold mb-2">3. One daily digest</h3>
              <p className="text-neutral-400">
                Wake up to a single Telegram message with 3-5 critical signals and a 1-sentence summary of why it matters.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison / The Reality Check */}
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold mb-12">The Reality Check</h2>
        <div className="flex flex-col md:flex-row gap-4 justify-center items-stretch">
          <div className="flex-1 p-6 rounded-2xl border border-red-900/30 bg-red-950/10 text-left">
            <h4 className="text-red-400 font-semibold mb-4 text-lg">Without Sift</h4>
            <ul className="space-y-3 text-neutral-400">
              <li>❌ 300+ unread tabs</li>
              <li>❌ Doomscrolling for 2 hours</li>
              <li>❌ Missing the actual important news</li>
              <li>❌ Brain fog from content overload</li>
            </ul>
          </div>
          <div className="flex-1 p-6 rounded-2xl border border-emerald-900/30 bg-emerald-950/10 text-left">
            <h4 className="text-emerald-400 font-semibold mb-4 text-lg">With Sift</h4>
            <ul className="space-y-3 text-neutral-300">
              <li>✅ 0 unread tabs</li>
              <li>✅ 3 minutes of reading per day</li>
              <li>✅ Knowing the exact industry shifts</li>
              <li>✅ Peace of mind</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-900 text-center py-12 text-neutral-600">
        <p>Stop scrolling. Start building.</p>
        <p className="mt-2 text-sm">© {new Date().getFullYear()} Sift AI Curator.</p>
      </footer>
    </main>
  );
}
