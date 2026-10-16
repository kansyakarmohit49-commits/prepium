/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SubjectId, UserProgressData } from './types/planner';
import { StoredResource } from './types/resources';
import {
  loadDataStore,
  onDataStoreChange,
  applyTheme,
  setThemeMode,
  calculateOverallProgress,
} from './utils/dataStore';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { SubjectView } from './components/SubjectView';
import { SubjectResourcesDashboard } from './components/SubjectResourcesDashboard';
import { SubjectResourcesView } from './components/SubjectResourcesView';
import { PDFViewerModal } from './components/PDFViewerModal';
import { AIResourceManagerModal } from './components/AIResourceManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { SyllabusModal } from './components/SyllabusModal';
import { OfflineIndicator } from './components/OfflineIndicator';

type AppView = 'home' | 'resources-dashboard' | 'subject-resources' | 'subject-planner';

export default function App() {
  const [progressData, setProgressData] = useState<UserProgressData>(() => loadDataStore());
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId | null>(null);
  const [targetChapterId, setTargetChapterId] = useState<string | undefined>(undefined);
  const [activePdfResource, setActivePdfResource] = useState<StoredResource | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddResourcesOpen, setIsAddResourcesOpen] = useState(false);
  const [addResourcesDefaultSubject, setAddResourcesDefaultSubject] = useState<SubjectId | undefined>(
    undefined
  );
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);
  const [syllabusInitialSubjectId, setSyllabusInitialSubjectId] = useState<SubjectId>('physics');

  // Apply theme & listen for datastore changes
  useEffect(() => {
    applyTheme(progressData.theme);
    const unsubscribe = onDataStoreChange((newData) => {
      setProgressData(newData);
      applyTheme(newData.theme);
    });
    return () => unsubscribe();
  }, [progressData.theme]);

  // Handle system dark mode changes dynamically
  useEffect(() => {
    if (progressData.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [progressData.theme]);

  const handleOpenResourcesDashboard = () => {
    setCurrentView('resources-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSubjectResources = (subId: SubjectId) => {
    setSelectedSubjectId(subId);
    setCurrentView('subject-resources');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSubjectPlanner = (subjectId: SubjectId, targetChapter?: string) => {
    setSelectedSubjectId(subjectId);
    setTargetChapterId(targetChapter);
    setCurrentView('subject-planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setCurrentView('home');
    setSelectedSubjectId(null);
    setTargetChapterId(undefined);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDashboard = () => {
    setCurrentView('resources-dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAddResources = (defaultSubId?: SubjectId) => {
    setAddResourcesDefaultSubject(defaultSubId);
    setIsAddResourcesOpen(true);
  };

  const handleOpenSyllabus = (subId?: SubjectId) => {
    if (subId) {
      setSyllabusInitialSubjectId(subId);
    }
    setIsSyllabusOpen(true);
  };

  const handleCycleTheme = () => {
    const cycle: Record<'light' | 'dark' | 'system', 'light' | 'dark' | 'system'> = {
      light: 'dark',
      dark: 'system',
      system: 'light',
    };
    const next = cycle[progressData.theme] || 'dark';
    setThemeMode(next);
  };

  const overall = calculateOverallProgress(progressData.tasks);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Application Header with Streak Overlap Fixed and Prepium Branding */}
      <Header
        currentView={currentView}
        currentSubjectId={selectedSubjectId}
        onNavigateHome={handleNavigateHome}
        onBackToDashboard={handleBackToDashboard}
        onOpenResourcesDashboard={handleOpenResourcesDashboard}
        streakDays={progressData.studyStreakDays}
        theme={progressData.theme}
        onThemeToggle={handleCycleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        overallPercent={overall.percent}
        onOpenSyllabus={() => handleOpenSyllabus(selectedSubjectId || 'physics')}
      />

      {/* Main Body Content based on active navigation view */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 pt-4 sm:pt-5">
        {currentView === 'resources-dashboard' ? (
          <SubjectResourcesDashboard
            onBack={handleNavigateHome}
            onSelectSubjectResources={handleSelectSubjectResources}
            onOpenStudyPlanner={(subId) =>
              handleSelectSubjectPlanner(subId || selectedSubjectId || 'physics')
            }
            onOpenAddResources={() => handleOpenAddResources()}
            onOpenSyllabus={() => handleOpenSyllabus('physics')}
          />
        ) : currentView === 'subject-resources' && selectedSubjectId ? (
          <SubjectResourcesView
            subjectId={selectedSubjectId}
            onBackToDashboard={handleBackToDashboard}
            onOpenViewer={(res) => setActivePdfResource(res)}
            onOpenAddResources={(subId) => handleOpenAddResources(subId || selectedSubjectId)}
            onOpenStudyPlanner={(subId) => handleSelectSubjectPlanner(subId)}
            onOpenSyllabus={(subId) => handleOpenSyllabus(subId)}
          />
        ) : currentView === 'subject-planner' && selectedSubjectId ? (
          <SubjectView
            subjectId={selectedSubjectId}
            progressData={progressData}
            targetChapterId={targetChapterId}
            onBack={handleNavigateHome}
            onSwitchSubject={(newSubId) => {
              setSelectedSubjectId(newSubId);
              setTargetChapterId(undefined);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : (
          <HomeView
            progressData={progressData}
            onSelectSubject={handleSelectSubjectPlanner}
            onOpenResourcesDashboard={handleOpenResourcesDashboard}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenSyllabus={handleOpenSyllabus}
          />
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 py-4 px-4 text-center text-xs text-slate-500 dark:text-slate-400 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 dark:text-slate-200">Prepium</span>
            <span>•</span>
            <span>CBSE Class 12 (2026–27) Study Planner &amp; Syllabus</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Local IndexedDB &amp; DataStore Active • No Internet Required • 100% Offline</span>
          </div>
        </div>
      </footer>

      {/* Built-in Offline PDF Viewer Modal */}
      <PDFViewerModal
        resource={activePdfResource}
        onClose={() => setActivePdfResource(null)}
      />

      {/* AI Resource Manager Import Modal */}
      <AIResourceManagerModal
        isOpen={isAddResourcesOpen}
        onClose={() => setIsAddResourcesOpen(false)}
        defaultSubjectId={addResourcesDefaultSubject}
        onImportComplete={(count) => {
          console.log(`Imported ${count} resources.`);
        }}
      />

      {/* CBSE Class XII 2026-27 Syllabus Modal */}
      <SyllabusModal
        isOpen={isSyllabusOpen}
        onClose={() => setIsSyllabusOpen(false)}
        initialSubjectId={syllabusInitialSubjectId}
      />

      {/* Settings & Reference Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        progressData={progressData}
        onOpenAddResources={() => {
          setIsSettingsOpen(false);
          handleOpenAddResources();
        }}
      />

      {/* Offline Status Badge */}
      <OfflineIndicator />
    </div>
  );
}
