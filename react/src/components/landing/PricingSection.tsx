/**
 * Kupuri Studios - Pricing Section
 * Landing page pricing component with Stripe integration
 * Part of the 7-Day MVP Sprint
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Building2, ArrowRight, Loader2 } from 'lucide-react';
import { stripeClient, PRICING_PLANS, type PricingPlan } from '../../api/stripeApi';

interface PricingCardProps {
  plan: PricingPlan;
  isAnnual: boolean;
  onSelect: (planId: string) => void;
  loading?: boolean;
}

function PricingCard({ plan, isAnnual, onSelect, loading }: PricingCardProps) {
  const annualPrice = plan.price > 0 ? Math.floor(plan.price * 10) : 0;
  const displayPrice = isAnnual ? annualPrice : plan.price;
  const monthlyEquivalent = isAnnual && plan.price > 0 ? Math.floor(annualPrice / 12) : plan.price;
  
  const icons = {
    starter: Sparkles,
    professional: Zap,
    enterprise: Building2,
  };
  
  const Icon = icons[plan.id as keyof typeof icons] || Sparkles;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`
        relative rounded-3xl p-8 
        ${plan.popular 
          ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white ring-4 ring-violet-400/50' 
          : 'bg-white/5 text-white border border-white/10'}
      `}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 bg-yellow-400 text-black text-sm font-bold rounded-full">
            Más Popular
          </span>
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-4">
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          ${plan.popular ? 'bg-white/20' : 'bg-violet-500/20'}
        `}>
          <Icon className={`w-6 h-6 ${plan.popular ? 'text-white' : 'text-violet-400'}`} />
        </div>
        <h3 className="text-xl font-bold">{plan.name}</h3>
      </div>
      
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">
            ${displayPrice}
          </span>
          <span className={`text-sm ${plan.popular ? 'text-white/70' : 'text-gray-400'}`}>
            /{isAnnual ? 'año' : 'mes'}
          </span>
        </div>
        {isAnnual && plan.price > 0 && (
          <p className={`text-sm mt-1 ${plan.popular ? 'text-white/70' : 'text-gray-400'}`}>
            ${monthlyEquivalent}/mes (2 meses gratis)
          </p>
        )}
      </div>
      
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-white' : 'text-green-400'}`} />
            <span className={`text-sm ${plan.popular ? 'text-white/90' : 'text-gray-300'}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>
      
      <button
        onClick={() => onSelect(plan.id)}
        disabled={loading || plan.price === 0}
        className={`
          w-full py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-2
          transition-all duration-200
          ${plan.popular 
            ? 'bg-white text-violet-600 hover:bg-gray-100' 
            : plan.price === 0
              ? 'bg-white/10 text-gray-400 cursor-not-allowed'
              : 'bg-violet-500 text-white hover:bg-violet-600'}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : plan.price === 0 ? (
          'Actual'
        ) : (
          <>
            Comenzar ahora
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </motion.div>
  );
}

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'starter') return;
    
    setLoadingPlan(planId);
    setError(null);
    
    try {
      await stripeClient.redirectToCheckout(planId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al procesar el pago');
      setLoadingPlan(null);
    }
  };

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1 rounded-full bg-violet-500/20 text-violet-400 text-sm font-medium mb-4"
          >
            Precios
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
          >
            Planes para cada necesidad
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Comienza gratis y escala cuando estés listo. Sin sorpresas, cancela cuando quieras.
          </motion.p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>
            Mensual
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`
              relative w-14 h-7 rounded-full transition-colors
              ${isAnnual ? 'bg-violet-500' : 'bg-white/20'}
            `}
          >
            <motion.div
              animate={{ x: isAnnual ? 28 : 4 }}
              className="absolute top-1 w-5 h-5 rounded-full bg-white"
            />
          </button>
          <span className={`text-sm ${isAnnual ? 'text-white' : 'text-gray-400'}`}>
            Anual
            <span className="ml-1 text-green-400">(2 meses gratis)</span>
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isAnnual={isAnnual}
              onSelect={handleSelectPlan}
              loading={loadingPlan === plan.id}
            />
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-gray-400 text-sm mb-4">
            Pago seguro procesado por Stripe
          </p>
          <div className="flex items-center justify-center gap-8 opacity-50">
            <img src="/stripe-badge.svg" alt="Stripe" className="h-8" />
            <img src="/ssl-badge.svg" alt="SSL Secure" className="h-8" />
          </div>
        </motion.div>

        {/* FAQ Teaser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-gray-400">
            ¿Tienes preguntas? {' '}
            <a href="#faq" className="text-violet-400 hover:underline">
              Consulta nuestras FAQ
            </a>
            {' '}o{' '}
            <a href="mailto:hello@kupuri.studio" className="text-violet-400 hover:underline">
              escríbenos
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default PricingSection;
