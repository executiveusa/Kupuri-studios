import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-white">KUPURI</div>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold text-white mb-6">
          Create AI-Powered Comics & Anime
        </h1>
        <p className="text-2xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Turn your imagination into stunning visual stories with AI-assisted storytelling,
          character generation, and professional print-on-demand fulfillment.
        </p>

        <div className="flex gap-4 justify-center mb-16">
          <Link href="/auth/register">
            <Button size="lg" className="text-lg px-8">
              Start Creating
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Learn More
            </Button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-bold text-white mb-2">AI Story Generation</h3>
            <p className="text-slate-300">
              Generate unique CYOA narratives with branching storylines using advanced AI
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-bold text-white mb-2">Character Design</h3>
            <p className="text-slate-300">
              Create and manage anime/manga-style characters with consistent visual identity
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-8">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-white mb-2">Print & NFT</h3>
            <p className="text-slate-300">
              Export to multiple formats or mint as NFTs on the blockchain
            </p>
          </div>
        </div>

        {/* Pricing Teaser */}
        <div className="mt-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Token-Powered Economy</h2>
          <p className="text-lg text-white/90 mb-8">
            Get 1,100 free tokens on signup. Purchase more to unlock unlimited creativity.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="text-lg">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
          <p>&copy; 2024 KUPURI Studios. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
