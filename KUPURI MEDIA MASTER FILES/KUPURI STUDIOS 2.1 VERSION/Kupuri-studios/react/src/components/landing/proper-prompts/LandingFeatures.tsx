import { motion } from 'framer-motion';
import { Wand2, Layers, Video, Users, Zap, Lock } from 'lucide-react';

const features = [
  {
    icon: Wand2,
    title: "Magic Canvas",
    description: "Sketch your ideas and watch them transform into high-fidelity art instantly using our real-time generation engine.",
    color: "text-purple-400"
  },
  {
    icon: Layers,
    title: "Multi-Model Access",
    description: "Switch between Flux, Midjourney, Stable Diffusion, and DALL-E 3 seamlessly within a single infinite workspace.",
    color: "text-blue-400"
  },
  {
    icon: Video,
    title: "Infinite Storyboarding",
    description: "Plan complex video sequences, arrange shots, and generate consistent characters across your entire timeline.",
    color: "text-pink-400"
  },
  {
    icon: Users,
    title: "Real-time Collaboration",
    description: "Invite your team to the canvas. Brainstorm, edit, and generate together in real-time.",
    color: "text-green-400"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for speed. Generate 4 images in parallel while you continue to refine your prompts.",
    color: "text-yellow-400"
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description: "Your IP is yours. Private cloud deployment options available for studios and agencies.",
    color: "text-cyan-400"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export function LandingFeatures() {
  return (
    <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-64 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Everything you need to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              create masterpieces
            </span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400"
          >
            Stop switching between 10 different tools. Kupuri Studios brings the entire creative pipeline into one infinite canvas.
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="group p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all hover:bg-slate-900 hover:shadow-2xl hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-100">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
