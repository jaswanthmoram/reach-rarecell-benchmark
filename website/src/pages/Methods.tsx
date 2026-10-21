import { SectionNav } from '../ui/SectionNav';
import { CostScatter } from './methods/CostScatter';
import { InclusionAudit } from './methods/InclusionAudit';
import { LensHero } from './methods/LensHero';
import { MethodMatrix } from './methods/MethodMatrix';
import { MethodPicker } from './methods/MethodPicker';
import { NAV } from './methods/model';
import './methods/methods.css';

const NAV_ITEMS = NAV.map(([id, label]) => ({ id, label }));

export default function Methods() {
  return (
    <div className="bg-canvas text-ink">
      <LensHero />
      <SectionNav label="Methods sections" items={NAV_ITEMS} />
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <MethodMatrix />
        <CostScatter />
        <InclusionAudit />
        <MethodPicker />
      </div>
    </div>
  );
}
