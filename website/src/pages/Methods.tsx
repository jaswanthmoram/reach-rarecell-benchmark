import MethodMatrix from './methods/MethodMatrix';
import CostAccuracy from './methods/CostAccuracy';
import Audit from './methods/Audit';
import Guidance from './methods/Guidance';
import Pipeline from './methods/Pipeline';
import { JumpBar, Rail } from './methods/PageNav';
import { useActiveSection } from './methods/useActiveSection';
import Hero from './methods/Hero';

export default function Methods() {
  const active = useActiveSection();
  return (
    <div>
      <Hero />
      <JumpBar active={active} />
      {/* Sections keep the site container (right edge level with the header); from 1600px the rail sits in the left gutter. */}
      <div className="relative">
        <aside className="absolute inset-y-0 right-[calc(50%+612px)] hidden w-[168px] min-[1600px]:block"><Rail active={active} /></aside>
        <MethodMatrix />
        <CostAccuracy />
        <Audit />
        <Guidance />
        <Pipeline />
      </div>
    </div>
  );
}
