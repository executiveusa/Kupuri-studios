import { motion } from 'framer-motion';
import { Check, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { getPricingPlans, PricingPlan, createPaymentIntent } from '@/api/billing';
import { useConfigs } from '@/contexts/configs';

// Fallback plans in case API is down or during dev
const defaultPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 0,
    currency: "USD",
    credits: 100,
    features: [
      "5 Projects",
      "100 Credits / month",
      "Standard Speed",
      "Public Gallery Access"
    ],
    popular: false
  },
  {
    id: "creator",
    name: "Creator",
    price: 29,
    currency: "USD",
    credits: 5000,
    features: [
      "Unlimited Projects",
      "5,000 Credits / month",
      "Fast GPU Access",
      "Private Mode",
      "Video Generation",
      "Commercial License"
    ],
    popular: true
  },
  {
    id: "studio",
    name: "Studio",
    price: 99,
    currency: "USD",
    credits: 20000,
    features: [
      "Everything in Creator",
      "20,000 Credits / month",
      "Team Collaboration",
      "API Access",
      "Dedicated Support",
      "Custom Models"
    ],
    popular: false
  }
];

export function LandingPricing() {
  const [plans, setPlans] = useState<PricingPlan[]>(defaultPlans);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const { setShowLoginDialog } = useConfigs();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await getPricingPlans();
        if (data && data.length > 0) {
          setPlans(data);
        }
      } catch (error) {
        console.warn("Failed to fetch pricing plans, using defaults", error);
      }
    };
    fetchPlans();
  }, []);

  const handlePurchase = async (plan: PricingPlan) => {
    // If free plan, just trigger login/signup
    if (plan.price === 0) {
      setShowLoginDialog(true);
      return;
    }

    setLoadingPlanId(plan.id);
    try {
      // Create payment intent
      const { clientSecret } = await createPaymentIntent(plan.id);
      console.log("Payment intent created:", clientSecret);
      // Here we would redirect to Stripe Checkout or open Stripe Elements
      // For now, let's simulate a delay and then show login if not logged in
      // or just alert
      alert(`Initiating Stripe checkout for ${plan.name}... (Client Secret: ${clientSecret.substring(0, 10)}...)`);
      
    } catch (error) {
      console.error("Purchase failed:", error);
      // If unauthorized, show login
      setShowLoginDialog(true);
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-proper-red/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-heading text-5xl md:text-6xl uppercase mb-6">
            Fuel Your <span className="text-proper-red">Creativity</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Simple credit-based pricing. Pay for what you generate. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(15, 23, 42, 0.9)" }}
              className={`relative p-8 rounded-2xl border transition-all duration-300 group ${
                plan.popular 
                  ? 'bg-slate-900/80 border-proper-red shadow-2xl shadow-proper-red/20' 
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-600'
              } flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-proper-red text-white text-xs font-bold px-4 py-1 uppercase tracking-widest flex items-center gap-1 shadow-lg">
                  <Zap className="w-3 h-3 fill-current" />
                  Most Popular
                </div>
              )}

              <div className="mb-8 text-center">
                <h3 className="text-lg font-bold uppercase tracking-widest text-slate-300 mb-4">{plan.name}</h3>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="text-5xl font-heading text-white">${plan.price}</span>
                  {plan.price > 0 && <span className="text-slate-500 font-medium">/mo</span>}
                </div>
                <div className="inline-block bg-white/5 rounded-lg px-3 py-1 text-sm text-yellow-400 font-mono mb-4">
                  {plan.credits.toLocaleString()} Credits
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-proper-red shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => handlePurchase(plan)}
                disabled={loadingPlanId === plan.id}
                className={`w-full rounded-none h-14 text-lg font-bold uppercase tracking-wider transition-all ${
                  plan.popular 
                    ? 'bg-white text-proper-red hover:bg-proper-red hover:text-white' 
                    : 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-black'
                }`}
              >
                {loadingPlanId === plan.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  plan.price === 0 ? "Start Free" : "Subscribe"
                )}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
