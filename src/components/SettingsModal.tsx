import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  BookOpen,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  Info,
  FolderPlus,
  FileText,
  Sparkles,
  HardDrive,
} from 'lucide-react';
import { UserProgressData, SubjectId } from '../types/planner';
import { SUBJECTS } from '../data/cbse12Data';
import {
  setThemeMode,
  exportBackupData,
  importBackupData,
  resetAllData,
  resetSubjectData,
} from '../utils/dataStore';
import { getResourceStats, onResourcesChange } from '../utils/resourceStorage';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  progressData: UserProgressData;
  onOpenAddResources: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  progressData,
  onOpenAddResources,
}) => {
  const [importStatus, setImportStatus] = useState<{ message: string; isError?: boolean } | null>(
    null
  );
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'preferences' | 'cbseBlueprint'>('preferences');
  const [resourceStats, setResourceStats] = useState<{
    totalCount: number;
    totalSize: number;
    bySubject: Record<SubjectId, number>;
  }>({
    totalCount: 0,
    totalSize: 0,
    bySubject: {
      physics: 0,
      chemistry: 0,
      mathematics: 0,
      biology: 0,
      english: 0,
      painting: 0,
    },
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      getResourceStats().then(setResourceStats).catch(() => {});
      const unsub = onResourcesChange(() => {
        getResourceStats().then(setResourceStats).catch(() => {});
      });
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectTheme = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Prepium_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importBackupData(content);
      if (res.success) {
        setImportStatus({ message: 'Backup restored successfully!' });
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus({ message: res.message, isError: true });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetAll = () => {
    resetAllData();
    setShowResetConfirm(false);
    setImportStatus({ message: 'All progress reset to clean state.' });
    setTimeout(() => setImportStatus(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Settings &amp; CBSE Reference
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalization, Offline Storage &amp; CBSE Class 12 (2026–27) Blueprint
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 pt-2 bg-slate-50/50 dark:bg-slate-950/40">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
              activeTab === 'preferences'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Preferences &amp; DataStore
          </button>
          <button
            onClick={() => setActiveTab('cbseBlueprint')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
              activeTab === 'cbseBlueprint'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            CBSE 2026–27 Blueprint
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'preferences' ? (
            <>
              {/* Theme Settings (Light / Dark / System) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Appearance Theme
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => handleSelectTheme('light')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition ${
                      progressData.theme === 'light'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Sun className="w-5 h-5 text-amber-500" />
                    <span className="text-xs font-semibold">Light</span>
                  </button>

                  <button
                    onClick={() => handleSelectTheme('dark')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition ${
                      progressData.theme === 'dark'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Moon className="w-5 h-5 text-indigo-400" />
                    <span className="text-xs font-semibold">Dark</span>
                  </button>

                  <button
                    onClick={() => handleSelectTheme('system')}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition ${
                      progressData.theme === 'system'
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Laptop className="w-5 h-5 text-slate-500" />
                    <span className="text-xs font-semibold">System</span>
                  </button>
                </div>
              </div>

              {/* Offline & Zero-Internet Guarantee Banner */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>100% Offline &amp; Zero Internet Permission</span>
                </div>
                <p className="text-xs text-emerald-700/90 dark:text-emerald-300/80 leading-relaxed">
                  Prepium operates entirely offline. Your checkmarks, task completions, and
                  study notes are stored in the device&apos;s persistent DataStore. No external servers or
                  internet permissions are invoked.
                </p>
                <div className="pt-2">
                  <PWAInstallButton variant="settings" />
                </div>
              </div>

              {/* Status Message */}
              {importStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    importStatus.isError
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{importStatus.message}</span>
                </div>
              )}

              {/* AI Resource Manager Section (Requirement 4) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                      <FolderPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        AI Resource Manager
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Process, categorize, clean titles, and save offline PDF documents
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onOpenAddResources}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Add Resources</span>
                  </button>
                </div>

                {/* Storage & Subject stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-indigo-200/60 dark:border-indigo-800/60">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-900/40">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                      Stored Offline PDFs
                    </span>
                    <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                      {resourceStats.totalCount} Documents
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-900/40">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                      IndexedDB Storage
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      {(resourceStats.totalSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-900/40">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                      Active Subjects
                    </span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      {Object.values(resourceStats.bySubject).filter((c) => c > 0).length} / 6 Populated
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>
                    New PDFs are cleaned of watermark covers and assigned locally without any cloud uploads.
                  </span>
                </div>
              </div>

              {/* Data Backup & Restore */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Backup &amp; Restore (JSON)
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Export your full 430-task progress so you never lose your hard work or can transfer
                  it to another phone.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleExportBackup}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                  >
                    <Download className="w-4 h-4 text-indigo-500" />
                    <span>Export Progress (JSON)</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                  >
                    <Upload className="w-4 h-4 text-emerald-500" />
                    <span>Import Progress (JSON)</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Danger Zone: Reset Progress */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <label className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Reset Area
                </label>
                {!showResetConfirm ? (
                  <div>
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset All 430 Tasks</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-rose-800 dark:text-rose-200">
                          Are you sure you want to reset all checklist tasks?
                        </p>
                        <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                          This will uncheck all 430 tasks across all 6 subjects. This action cannot be
                          undone unless you export a backup first.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleResetAll}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
                      >
                        Yes, Reset Everything
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* CBSE Class 12 2026-27 Blueprint & Guidelines */
            <div className="space-y-5 text-slate-800 dark:text-slate-200">
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  CBSE Class 12 Board Scheme (Academic Year 2026–27)
                </h4>
                <p className="text-xs text-indigo-800/90 dark:text-indigo-300/80 mt-1 leading-relaxed">
                  Competency-focused question papers with ~50% application, assertion-reasoning,
                  case-based, and multi-concept questions.
                </p>
              </div>

              {/* Subject Breakdown Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Marks Distribution (6 Subjects)
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="p-2.5">Subject</th>
                        <th className="p-2.5">Code</th>
                        <th className="p-2.5">Theory</th>
                        <th className="p-2.5">Practical / Internal</th>
                        <th className="p-2.5">Total Chapters</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {SUBJECTS.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 font-bold">{s.name}</td>
                          <td className="p-2.5 text-slate-500 dark:text-slate-400">{s.code}</td>
                          <td className="p-2.5 font-semibold">{s.theoryMarks} Marks</td>
                          <td className="p-2.5 text-slate-500 dark:text-slate-400">
                            {s.practicalMarks} Marks
                          </td>
                          <td className="p-2.5 font-bold text-indigo-600 dark:text-indigo-400">
                            {s.totalChapters} Ch
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5-Step Study Strategy */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Recommended Daily 5-Step Routine
                </h4>
                <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-decimal pl-4">
                  <li>
                    <strong className="text-slate-900 dark:text-white">Theory:</strong> Complete
                    NCERT textbook reading line-by-line along with comprehensive classroom notes.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">Revision:</strong> Synthesize
                    1-page formula summaries, reaction mechanisms, or poetic devices.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">Module + NCERT:</strong> Solve
                    every in-text example, exercise question and NCERT exemplar.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">PYQ:</strong> Solve at least
                    past 10 years&apos; CBSE board questions to identify recurring question models.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-white">
                      Final Revision + Sample Paper:
                    </strong>{' '}
                    Attempt timed 3-hour mock board papers with step marking self-evaluation.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
