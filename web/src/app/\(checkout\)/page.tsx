'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TokenPackage {
  id: string;
  id: string;
  tokens: number;
  bonus: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const comicId = searchParams.get('comic');

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch('/api/stripe/prices');
        if (response.ok) {
          const data = await response.json();
          setPackages(data);
          setSelectedPackage(data[0]?.id || '');
        }
      } catch (err) {
        setError('Failed to load packages');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handleCheckout = async () => {
    setError('');
    setProcessing(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId: selectedPackage }),
      });

      if (response.ok) {
        const data = await response.json();
        // In a real app, redirect to Stripe checkout
        // window.location.href = data.url;
        alert(`Checkout session created: ${data.sessionId}\n\nTokens will be added after payment.`);
        router.push('/dashboard');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Checkout failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Link href={comicId ? `/dashboard/create/${comicId}/preview` : '/dashboard'} className="text-purple-400 hover:underline mb-6 inline-block">
          ← Back
        </Link>

        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle>Buy Tokens</CardTitle>
            <CardDescription>Choose a package and unlock creative potential</CardDescription>
          </CardHeader>
        </Card>

        {error && (
          <Card className="border-red-500/50 bg-red-950/20 mb-8">
            <CardContent className="pt-6 text-red-500">{error}</CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {packages.map((pkg) => {
            const totalTokens = pkg.tokens + Math.floor(pkg.tokens * pkg.bonus);
            const bonusTokens = Math.floor(pkg.tokens * pkg.bonus);
            return (
              <Card
                key={pkg.id}
                className={`cursor-pointer transition border-2 ${
                  selectedPackage === pkg.id
                    ? 'border-purple-500 bg-purple-950'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                <CardHeader>
                  <CardTitle className="capitalize text-lg">{pkg.id}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400">Base Tokens</p>
                    <p className="text-2xl font-bold text-white">{pkg.tokens}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Bonus</p>
                    <p className="text-lg font-bold text-green-400">+{bonusTokens}</p>
                  </div>
                  <div className="border-t border-slate-600 pt-4">
                    <p className="text-xs text-slate-400">Total</p>
                    <p className="text-xl font-bold text-purple-400">{totalTokens}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedPackage && packages.length > 0 && (
              <>
                <div className="border-t border-slate-700 pt-4 space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal</span>
                    <span>$49.99</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Tax (0%)</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-white text-lg border-t border-slate-700 pt-2">
                    <span>Total</span>
                    <span>$49.99</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-lg py-6"
                >
                  {processing ? 'Processing...' : 'Proceed to Payment'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
