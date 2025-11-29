import { LandingHero } from './LandingHero';
import { LandingStickyScroll } from './LandingStickyScroll';
import { LandingShowcase } from './LandingShowcase';
import { LandingFooter } from './LandingFooter';
import { LandingNavbar } from './LandingNavbar';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-proper-red selection:text-white font-sans">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingStickyScroll />
        <LandingShowcase />
      </main>
      <LandingFooter />
    </div>
  );
}
