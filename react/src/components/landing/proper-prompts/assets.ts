import heroBg from '@/assets/images/proper-prompts/kupuri-asset-1.png';
import mascot from '@/assets/images/proper-prompts/kupuri-asset-2.png';
import guideFeature from '@/assets/images/proper-prompts/kupuri-asset-3.png';
import showcase1 from '@/assets/images/proper-prompts/kupuri-asset-4.png';

export const PROPER_ASSETS = {
  hero: {
    background: heroBg,
    character: mascot, 
  },
  guide: {
    feature: guideFeature,
  },
  showcase: [
    showcase1,
    showcase1, // Reusing for now, user can add more
    showcase1,
    showcase1,
    showcase1,
  ]
};
