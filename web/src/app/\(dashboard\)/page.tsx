'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Comic {
  id: string;
  title: string;
  theme: string;
  status: string;
  createdAt: string;
}

interface TokenBalance {
  balance: number;
  spent: number;
  earned: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [comics, setComics] = useState<Comic[]>([]);
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        // Fetch comics
        const comicsRes = await fetch('/api/comics', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (comicsRes.ok) {
          setComics(await comicsRes.json());
        }

        // Fetch token balance
        const balanceRes = await fetch('/api/tokens/balance', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (balanceRes.ok) {
          setBalance(await balanceRes.json());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">My Comics</h1>
          <Link href="/auth/logout" onClick={() => {
            localStorage.removeItem('token');
            router.push('/auth/login');
          }}>
            <Button variant="ghost">Logout</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Token Balance Card */}
        {balance && (
          <Card className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 border-0">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <p className="text-white/80 text-sm">Available Tokens</p>
                  <p className="text-4xl font-bold text-white">{balance.balance}</p>
                </div>
                <div>
                  <p className="text-white/80 text-sm">Total Earned</p>
                  <p className="text-2xl font-bold text-white">{balance.earned}</p>
                </div>
                <div className="flex items-end">
                  <Link href="/checkout" className="w-full">
                    <Button className="w-full">Buy Tokens</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mb-8 border-red-500/50 bg-red-950/20">
            <CardContent className="pt-6 text-red-500">{error}</CardContent>
          </Card>
        )}

        {/* Create Comic Button */}
        <Link href="/dashboard/create" className="inline-block mb-8">
          <Button size="lg">+ Create New Comic</Button>
        </Link>

        {/* Comics Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Your Comics</h2>
          {comics.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-12 text-center">
                <p className="text-slate-300 mb-4">No comics yet. Create your first one!</p>
                <Link href="/dashboard/create">
                  <Button>Start Creating</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comics.map((comic) => (
                <Link key={comic.id} href={`/dashboard/create/${comic.id}/preview`}>
                  <Card className="bg-slate-800 border-slate-700 hover:border-purple-500 cursor-pointer transition">
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{comic.title}</CardTitle>
                      <CardDescription className="capitalize">{comic.theme}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-purple-400 capitalize bg-purple-950 px-2 py-1 rounded">
                          {comic.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(comic.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
