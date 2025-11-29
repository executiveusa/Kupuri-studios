import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LandingFooter() {
  return (
    <footer className="bg-proper-red text-white py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Massive Text */}
          <div>
            <h2 className="font-heading text-[15vw] lg:text-[10vw] leading-[0.8] uppercase mb-8">
              Stay Up To
              <br />
              Date With
              <br />
              AI
            </h2>
            <p className="text-xl md:text-2xl font-medium max-w-md opacity-90">
              Artificial Intelligence is evolving every day. Join the Kupuri Studios newsletter to get the latest models, prompts, and techniques.
            </p>
          </div>

          {/* Right: Form & Links */}
          <div className="flex flex-col gap-12">
            <div className="bg-white/10 p-8 md:p-12 backdrop-blur-sm border border-white/20">
              <h3 className="font-heading text-3xl uppercase mb-6">Signup for Updates</h3>
              <div className="flex flex-col gap-4">
                <Input 
                  placeholder="YOUR EMAIL ADDRESS..." 
                  className="h-14 bg-transparent border-2 border-white text-white placeholder:text-white/70 rounded-none text-lg px-6 focus-visible:ring-0 focus-visible:border-black transition-colors"
                />
                <Button 
                  size="lg" 
                  className="h-14 bg-white text-proper-red hover:bg-black hover:text-white rounded-none text-lg font-bold uppercase tracking-wider w-full"
                >
                  Sign Me Up
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-8 text-sm font-bold uppercase tracking-widest">
              <a href="#" className="hover:text-black transition-colors">Instagram</a>
              <a href="#" className="hover:text-black transition-colors">Twitter</a>
              <a href="#" className="hover:text-black transition-colors">Discord</a>
              <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
            </div>
            
            <div className="text-sm opacity-60">
              © 2025 Kupuri Studios. All Rights Reserved.
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
