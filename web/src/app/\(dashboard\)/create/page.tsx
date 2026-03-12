'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const THEMES = [
  { id: 'pokemon-adventure', name: 'Pokemon Adventure', emoji: '🎮' },
  { id: 'mystery-detective', name: 'Mystery Detective', emoji: '🔍' },
  { id: 'fantasy-quest', name: 'Fantasy Quest', emoji: '🗡️' },
  { id: 'scifi-space', name: 'Space Explorer', emoji: '🚀' },
  { id: 'educational-stem', name: 'STEM Adventure', emoji: '🔬' },
  { id: 'anime-highschool', name: 'High School Story', emoji: '🏫' },
];

export default function CreateComicPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    theme: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/comics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create comic');
      }

      const data = await response.json();
      router.push(`/dashboard/create/${data.id}/preview`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create comic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-purple-400 hover:underline mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Create New Comic</CardTitle>
            <CardDescription>Start your creative journey</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-300">Title</label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter comic title"
                  required
                  className="mt-1 bg-slate-700 border-slate-600"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">Description (Optional)</label>
                <Input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your comic"
                  className="mt-1 bg-slate-700 border-slate-600"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">Theme</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, theme: theme.id })}
                      className={`p-4 rounded-lg border-2 transition text-center ${
                        formData.theme === theme.id
                          ? 'border-purple-500 bg-purple-950'
                          : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-2xl mb-2">{theme.emoji}</div>
                      <div className="text-sm font-medium text-white">{theme.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className="text-sm text-red-500">{error}</div>}

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading || !formData.title || !formData.theme}
                  className="flex-1"
                >
                  {loading ? 'Creating...' : 'Create Comic'}
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
