'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Comic {
  id: string;
  title: string;
  description: string;
  theme: string;
  status: string;
  pages?: Array<{
    id: string;
    pageNumber: number;
    content: string;
    choices?: Array<{
      id: string;
      text: string;
    }>;
  }>;
}

export default function PreviewPage() {
  const router = useRouter();
  const params = useParams();
  const [comic, setComic] = useState<Comic | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const comicId = params?.id as string;

  useEffect(() => {
    const fetchComic = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const response = await fetch(`/api/comics/${comicId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          setComic(await response.json());
        } else {
          throw new Error('Comic not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load comic');
      } finally {
        setLoading(false);
      }
    };

    if (comicId) fetchComic();
  }, [comicId, router]);

  const handleGenerate = async () => {
    setError('');
    setGenerating(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/comics/${comicId}/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Generated ${data.pagesGenerated} pages! Used ${data.tokensCost} tokens.`);
        router.refresh();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Generation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate comic');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!comic) return <div className="p-8 text-red-500">Comic not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-purple-400 hover:underline mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">{comic.title}</CardTitle>
                <CardDescription className="capitalize mt-2">{comic.theme}</CardDescription>
              </div>
              <span className="text-xs font-semibold text-purple-400 bg-purple-950 px-3 py-1 rounded">
                {comic.status}
              </span>
            </div>
            {comic.description && <p className="text-slate-300 mt-4">{comic.description}</p>}
          </CardHeader>
        </Card>

        {error && (
          <Card className="border-red-500/50 bg-red-950/20 mb-8">
            <CardContent className="pt-6 text-red-500">{error}</CardContent>
          </Card>
        )}

        {comic.status === 'draft' && (
          <Card className="bg-blue-950/20 border-blue-500/50 mb-8">
            <CardContent className="pt-6">
              <p className="text-blue-300 mb-4">
                ✨ Ready to generate your story? Click below to use AI to create an amazing narrative!
              </p>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {generating ? 'Generating Story...' : '🚀 Generate Story'}
              </Button>
            </CardContent>
          </Card>
        )}

        {comic.pages && comic.pages.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">Story Pages</h3>
            <div className="space-y-6">
              {comic.pages.map((page) => (
                <Card key={page.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg">Page {page.pageNumber}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-300 leading-relaxed">{page.content}</p>
                    {page.choices && page.choices.length > 0 && (
                      <div className="border-t border-slate-700 pt-4">
                        <p className="text-sm font-semibold text-purple-400 mb-3">Choices:</p>
                        <div className="space-y-2">
                          {page.choices.map((choice) => (
                            <div key={choice.id} className="text-slate-300 text-sm">
                              • {choice.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {comic.status === 'completed' && (
              <div className="flex gap-4 mt-8">
                <Link href={`/checkout?comic=${comicId}`} className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                    Export & Print
                  </Button>
                </Link>
                <Button variant="outline" className="flex-1">
                  Share
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
