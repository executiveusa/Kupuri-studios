import { LandingHero } from './LandingHero';
import { InteractiveDemo } from './InteractiveDemo';
import { LandingStickyScroll } from './LandingStickyScroll';
import { LandingShowcase } from './LandingShowcase';
import { LandingFooter } from './LandingFooter';
import { LandingNavbar } from './LandingNavbar';
import ServiceGrid from '@/components/ServiceGrid';
import Footer from '@/components/Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-proper-red selection:text-white font-sans">
      <LandingNavbar />
      <main>
        <LandingHero />
        <InteractiveDemo />
        <LandingStickyScroll />
        <ServiceGrid />
        <LandingShowcase />
      </main>
      <Footer />
    </div>
  );
}
