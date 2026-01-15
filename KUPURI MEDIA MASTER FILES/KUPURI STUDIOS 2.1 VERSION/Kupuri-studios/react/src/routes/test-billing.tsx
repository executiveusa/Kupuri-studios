import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { CreditBalance } from '@/components/billing/CreditBalance'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/test-billing')({
  component: TestBillingPage,
})

function TestBillingPage() {
  const [balance, setBalance] = useState(1000);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-12 p-8">
      <h1 className="text-4xl font-heading uppercase">Billing Component Test Harness</h1>
      
      <div className="p-12 border border-white/20 rounded-2xl bg-slate-900/50 backdrop-blur-sm flex flex-col items-center gap-8">
        <h2 className="text-xl text-slate-400">Credit Balance Animation</h2>
        
        {/* The Component Under Test */}
        <div className="scale-150 p-4 border border-dashed border-slate-700 rounded-lg">
          <CreditBalance balance={balance} />
        </div>

        <div className="flex gap-4">
          <Button onClick={() => setBalance(b => b + 100)} variant="outline">
            Add 100
          </Button>
          <Button onClick={() => setBalance(b => b + 1000)} variant="outline">
            Add 1,000
          </Button>
          <Button onClick={() => setBalance(b => b + 5432)} variant="outline">
            Add Random
          </Button>
          <Button onClick={() => setBalance(0)} variant="destructive">
            Reset
          </Button>
        </div>
      </div>

      <div className="max-w-md text-center text-slate-500 text-sm">
        <p>
          Verify that the numbers count up smoothly (spring physics) and the text flashes gold/yellow during the update.
        </p>
      </div>
    </div>
  )
}
