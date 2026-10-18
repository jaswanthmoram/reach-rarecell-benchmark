import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Leaderboard } from './components/Leaderboard';
import { HeatmapExplorer } from './components/HeatmapExplorer';
import { TracksExplorer } from './components/TracksExplorer';
import { ArchitectureSection } from './components/ArchitectureSection';
import { DatasetMatrix } from './components/DatasetMatrix';
import { MethodAuditSection } from './components/MethodAuditSection';
import { FiguresGallery } from './components/FiguresGallery';
import { QuickstartGuide } from './components/QuickstartGuide';
import { CitationFooter } from './components/CitationFooter';

export function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0B0B0B] antialiased selection:bg-[#DBEAFE] selection:text-[#1D4ED8]">
      <Navbar
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
      />
      <div
        className={`transition-[padding] duration-200 ${
          sidebarCollapsed ? 'lg:pl-0' : 'lg:pl-64'
        }`}
      >
        <main>
          <Hero />
          <Leaderboard />
          <HeatmapExplorer />
          <TracksExplorer />
          <ArchitectureSection />
          <DatasetMatrix />
          <MethodAuditSection />
          <FiguresGallery />
          <QuickstartGuide />
        </main>
        <CitationFooter />
      </div>
    </div>
  );
}

export default App;
