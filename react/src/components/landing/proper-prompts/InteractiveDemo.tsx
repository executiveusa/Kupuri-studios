import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Play, Download, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  prompt: string;
  previewImage: string;
  completed: boolean;
}

export function InteractiveDemo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTutorial, setActiveTutorial] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const tutorials: Tutorial[] = [
    {
      id: 'generate-scene',
      title: t('home.demo.tutorial1.title', 'Generate First Scene'),
      description: t('home.demo.tutorial1.description', 'Watch AI create a professional anime scene from a simple prompt'),
      duration: '20s',
      prompt: 'Anime girl with silver hair, cyberpunk city background, neon lights, dramatic lighting, studio quality',
      previewImage: '/demo/scene-preview.jpg',
      completed: false,
    },
    {
      id: 'add-background',
      title: t('home.demo.tutorial2.title', 'Add Background Layer'),
      description: t('home.demo.tutorial2.description', 'One-click style transfer for consistent backgrounds'),
      duration: '20s',
      prompt: 'Cyberpunk Tokyo street, rain-soaked, neon reflections, night scene, cinematic wide shot',
      previewImage: '/demo/background-preview.jpg',
      completed: false,
    },
    {
      id: 'export-storyboard',
      title: t('home.demo.tutorial3.title', 'Export Storyboard'),
      description: t('home.demo.tutorial3.description', 'Get production-ready PDF with panel descriptions'),
      duration: '20s',
      prompt: '',
      previewImage: '/demo/export-preview.jpg',
      completed: false,
    },
  ];

  const handleStartTutorial = (index: number) => {
    setActiveTutorial(index);
    setIsPlaying(true);
    // Simulate tutorial completion after duration
    setTimeout(() => {
      setIsPlaying(false);
      tutorials[index].completed = true;
    }, 20000);
  };

  const allCompleted = tutorials.every(t => t.completed);

  return (
    <section id="interactive-demo" className="relative py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-proper-red/10 px-6 py-2 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-proper-red" />
            <span className="text-proper-red font-bold uppercase tracking-wider text-sm">
              {t('home.demo.badge', 'Try It Live')}
            </span>
          </div>
          
          <h2 className="font-heading text-5xl md:text-7xl text-slate-900 uppercase mb-6 tracking-tight">
            {t('home.demo.headline', 'See It Work In')} <span className="text-proper-red">60 Seconds</span>
          </h2>
          
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            {t('home.demo.subheadline', 'No signup required. Watch how professionals create production-ready scenes in minutes, not hours.')}
          </p>
        </motion.div>

        {/* Interactive Tutorial Grid */}
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left: Tutorial Steps */}
          <div className="space-y-4">
            {tutorials.map((tutorial, index) => (
              <motion.div
                key={tutorial.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  activeTutorial === index
                    ? 'border-proper-red bg-proper-red/5 shadow-xl scale-105'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg'
                } ${tutorial.completed ? 'opacity-60' : ''}`}
                onClick={() => !isPlaying && handleStartTutorial(index)}
              >
                <div className="flex items-start gap-4">
                  {/* Step Number or Completion Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    tutorial.completed 
                      ? 'bg-green-100 text-green-600'
                      : activeTutorial === index 
                        ? 'bg-proper-red text-white'
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tutorial.completed ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-slate-900">
                        {tutorial.title}
                      </h3>
                      <span className="text-sm font-medium text-slate-500">
                        {tutorial.duration}
                      </span>
                    </div>
                    
                    <p className="text-slate-600 mb-3">
                      {tutorial.description}
                    </p>

                    {tutorial.prompt && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Prompt Example:
                        </span>
                        <p className="text-sm text-slate-700 font-mono">
                          {tutorial.prompt}
                        </p>
                      </div>
                    )}

                    {!tutorial.completed && activeTutorial === index && !isPlaying && (
                      <Button
                        onClick={() => handleStartTutorial(index)}
                        className="mt-4 w-full bg-proper-red hover:bg-black text-white font-bold uppercase tracking-wider"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Tutorial
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right: Live Canvas Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="sticky top-24"
          >
            <div className="bg-white rounded-xl shadow-2xl border-2 border-slate-200 overflow-hidden">
              {/* Canvas Header */}
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-white/60 text-sm font-mono">
                  canvas.kupuri.studio
                </span>
              </div>

              {/* Canvas Body - Preview Area */}
              <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 p-8 flex items-center justify-center">
                {isPlaying ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-proper-red border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-600 font-medium">
                      Generating {tutorials[activeTutorial].title}...
                    </p>
                  </motion.div>
                ) : allCompleted ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                      Demo Complete!
                    </h3>
                    <p className="text-slate-600 mb-6">
                      Ready to create your own professional content?
                    </p>
                    <Button
                      onClick={() => navigate({ to: '/canvas/$id', params: { id: 'new' } })}
                      size="lg"
                      className="bg-proper-red hover:bg-black text-white font-bold uppercase tracking-wider"
                    >
                      Start Creating Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                ) : (
                  <div className="text-center">
                    <Play className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-500 font-medium">
                      Click a tutorial to start
                    </p>
                  </div>
                )}
              </div>

              {/* Canvas Footer - Tools Preview */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <div className="flex items-center gap-4">
                    <button className="hover:text-proper-red transition-colors">
                      <Sparkles className="w-5 h-5" />
                    </button>
                    <button className="hover:text-proper-red transition-colors">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                  <span className="font-mono text-xs text-slate-400">
                    Step {activeTutorial + 1}/3
                  </span>
                </div>
              </div>
            </div>

            {/* Value Props Under Canvas */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: 'Free Tier', value: '100%', icon: '✓' },
                { label: 'Export', value: 'HD', icon: '↓' },
                { label: 'Speed', value: '<2min', icon: '⚡' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white p-4 rounded-lg border border-slate-200 text-center"
                >
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-lg font-bold text-proper-red">{stat.value}</div>
                  <div className="text-xs text-slate-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full shadow-xl">
            <span className="text-lg font-medium">
              {t('home.demo.ctaText', 'Ready to create your own?')}
            </span>
            <Button
              onClick={() => navigate({ to: '/canvas/$id', params: { id: 'new' } })}
              variant="outline"
              className="rounded-full border-white text-white hover:bg-white hover:text-slate-900 font-bold uppercase tracking-wider"
            >
              Get Started Free
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
