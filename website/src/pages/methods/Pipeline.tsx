import { href } from '../../app/router';
import { Container, Icon } from '../../ui';
import { GLOBAL_STATS as G } from '../../data/benchmarkData';

/** The pipeline is documented once, in Docs; here it is one line that points there. */
export default function Pipeline() {
  return (
    <section id="pipeline" aria-label="Pipeline" className="border-t border-line pb-4 pt-10">
      <Container>
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-2 text-[15px] leading-relaxed text-ink-2">
          <span>Every number on this page comes from the {G.pipelinePhases}-phase pipeline. Docs lists the command for each phase.</span>
          <a href={href('/docs', 'section=reproduce')}
            className="group inline-flex min-h-11 items-center gap-1.5 rounded-chip font-medium text-accent underline decoration-accent/30 underline-offset-2 transition-colors duration-150 hover:decoration-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            Reproduce the paper
            <Icon name="arrow-right" size={14} className="transition-transform duration-150 group-hover:translate-x-0.5" />
          </a>
        </p>
      </Container>
    </section>
  );
}
