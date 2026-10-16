import React from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Settings,
  Flame,
  GraduationCap,
  ChevronLeft,
  Share2,
  BookOpen,
} from 'lucide-react';
import { SubjectId } from '../types/planner';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentView: 'home' | 'resources-dashboard' | 'subject-resources' | 'subject-planner';
  currentSubjectId: SubjectId | null;
  onNavigateHome: () => void;
  onBackToDashboard?: () => void;
  onOpenResourcesDashboard?: () => void;
  streakDays: number;
  theme: 'light' | 'dark' | 'system';
  onThemeToggle: () => void;
  onOpenSettings: () => void;
  overallPercent: number;
  onOpenSyllabus?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  currentSubjectId,
  onNavigateHome,
  onBackToDashboard,
  onOpenResourcesDashboard,
  streakDays,
  theme,
  onThemeToggle,
  onOpenSettings,
  overallPercent,
  onOpenSyllabus,
}) => {
  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="w-4 h-4 text-amber-400" />;
    if (theme === 'light') return <Sun className="w-4 h-4 text-amber-500" />;
    return <Laptop className="w-4 h-4 text-indigo-400" />;
  };

  const streakLabel = streakDays === 1 ? 'One Day Streak' : `${streakDays} Days Streak`;

  const handleShareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Prepium — CBSE 2026-27 Planner & Syllabus',
          text: `I'm using Prepium for CBSE Class 12 Board preparation (Current Progress: ${overallPercent}%). 100% offline study planner!`,
          url: window.location.href,
        });
      } catch {
        // Ignored dismissal
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 transition-colors shadow-xs">
      {/* Primary Navigation Bar */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-3">
        {/* Left: Branding or Back Button */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
          {currentView === 'subject-resources' ? (
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition font-medium text-sm group"
            >
              <ChevronLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Resources Dashboard</span>
              <span className="sm:hidden text-xs font-bold">Back</span>
            </button>
          ) : currentView === 'resources-dashboard' ? (
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition font-medium text-sm group"
            >
              <ChevronLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Home</span>
              <span className="sm:hidden text-xs font-bold">Back</span>
            </button>
          ) : currentView === 'subject-planner' ? (
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition font-medium text-sm group"
            >
              <ChevronLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">All Subjects</span>
              <span className="sm:hidden text-xs font-bold">Back</span>
            </button>
          ) : (
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2.5 text-left focus:outline-none group select-none"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white leading-none whitespace-nowrap">
                    Prepium
                  </h1>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex-shrink-0">
                    12th
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide truncate max-w-[170px] sm:max-w-none">
                  CBSE 2026–27 Planner &amp; Syllabus
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Right Area: Clearly Separated Streak & Action Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Desktop & Tablet: Distinct One Day Streak Component */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-xs flex-shrink-0 select-none"
            title={`You've studied ${streakDays} day(s) in a row!`}
          >
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse flex-shrink-0" />
            <span className="whitespace-nowrap">{streakLabel}</span>
          </div>

          {/* Syllabus Quick Button */}
          {onOpenSyllabus && (
            <button
              onClick={onOpenSyllabus}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition active:scale-95"
              title="Open CBSE 12th Syllabus"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>Syllabus</span>
            </button>
          )}

          {/* PWA Install Button */}
          <PWAInstallButton variant="header" />

          {/* Theme Quick Toggle */}
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            title={`Current Theme: ${theme.toUpperCase()} (Click to change)`}
            aria-label="Toggle Theme"
          >
            {getThemeIcon()}
          </button>

          {/* Share Button */}
          <button
            onClick={handleShareApp}
            className="hidden sm:flex p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            title="Share Prepium"
            aria-label="Share App"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Settings Modal */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            title="Settings & CBSE Blueprint"
            aria-label="Open Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Header: Dedicated Row for One Day Streak & Status (Prevents ANY Overlap on Mobile) */}
      <div className="sm:hidden px-3 py-1.5 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
        <div
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 font-bold text-[11px] select-none"
          title={`You've studied ${streakDays} day(s) in a row!`}
        >
          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 flex-shrink-0 animate-pulse" />
          <span>{streakLabel}</span>
        </div>

        {onOpenSyllabus && (
          <button
            onClick={onOpenSyllabus}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <BookOpen className="w-3 h-3" />
            <span>CBSE Syllabus</span>
          </button>
        )}

        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {overallPercent}% Done
        </span>
      </div>
    </header>
  );
};
