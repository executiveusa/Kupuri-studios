'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const pricingTiers = [
  {
    name: 'Free',
    price: '0',
    period: 'Forever',
    description: 'Perfect for getting started',
    features: [
      '5 Projects',
      'Basic AI Models',
      '100 Generations/month',
      'Community Support',
      'No Credit Card Required',
    ],
    cta: 'Get Started',
    ctaStyle: 'secondary',
  },
  {
    name: 'Pay As You Go',
    price: 'Variable',
    period: 'Per Usage',
    description: 'Perfect for creators who want more',
    features: [
      'Unlimited Projects',
      'All AI Models (GPT-4, Claude, Flux, etc.)',
      'Pay $0.01 - $1 per generation',
      'Priority Support',
      'Commercial License',
      'Advanced Analytics',
    ],
    cta: 'Start Using',
    ctaStyle: 'primary',
    highlighted: true,
  },
  {
    name: 'Pro Team',
    price: 'Custom',
    period: 'Per Team',
    description: 'For teams and agencies',
    features: [
      'Everything in Pay As You Go',
      'Team Collaboration',
      'Custom API Access',
      'Dedicated Account Manager',
      'SLA Guarantee',
      'Volume Discounts',
    ],
    cta: 'Contact Sales',
    ctaStyle: 'secondary',
  },
]

export function PricingPage() {
  return (
    <section className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-white mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-400">
            Pay only for what you use. No hidden fees, no subscriptions.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
              whileHover={{ y: -8 }}
              className={`relative p-8 rounded-2xl backdrop-blur-sm transition-all ${
                tier.highlighted
                  ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50 ring-2 ring-blue-500/20'
                  : 'bg-gray-800/50 border border-gray-700/50'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
              <p className="text-gray-400 text-sm mb-6">{tier.description}</p>

              <div className="mb-8">
                <span className="text-5xl font-bold text-white">${tier.price}</span>
                <span className="text-gray-400 ml-2">/{tier.period}</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full py-3 rounded-xl font-semibold transition-all mb-8 ${
                  tier.ctaStyle === 'primary'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'border border-gray-500 hover:border-gray-300 text-white'
                }`}
              >
                {tier.cta}
              </motion.button>

              <ul className="space-y-4">
                {tier.features.map((feature, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 text-gray-300"
                  >
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-20 max-w-3xl mx-auto"
        >
          <h3 className="text-3xl font-bold text-white mb-12 text-center">
            Frequently Asked Questions
          </h3>

          <div className="space-y-6">
            {[
              {
                q: 'Do I need a credit card to start?',
                a: 'No! The free tier requires no credit card. You only add payment when you exceed free limits.',
              },
              {
                q: 'How much does each generation cost?',
                a: '$0.01 - $1.00 depending on the model. GPT-4 is more expensive than Flux, for example.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes! With pay-as-you-go, you have complete control. Use it or don\'t—no commitments.',
              },
              {
                q: 'Is there a monthly limit?',
                a: 'No limits on monthly spending. You control your budget and get alerts at thresholds.',
              },
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-xl bg-gray-800/50 border border-gray-700/50"
              >
                <h4 className="font-semibold text-white mb-2">{faq.q}</h4>
                <p className="text-gray-400">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default PricingPage
