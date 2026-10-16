import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  BookOpen,
  FolderPlus,
  FileText,
  ArrowRight,
  ShieldCheck,
  Zap,
  FlaskConical,
  Calculator,
  Dna,
  BookOpenText,
  Palette,
  CheckCircle2,
  Calendar,
  Download,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Archive,
  Trash2,
} from 'lucide-react';
import { SubjectId } from '../types/planner';
import { SUBJECTS } from '../data/cbse12Data';
import {
  getResourceStats,
  onResourcesChange,
  downloadAllResourcesZip,
  clearAllResources,
} from '../utils/resourceStorage';
import { installAllPrebundledResources } from '../utils/installPrebundledResources';

interface Props {
  onBack: () => void;
  onSelectSubjectResources: (subjectId: SubjectId) => void;
  onOpenStudyPlanner: (subjectId?: SubjectId) => void;
  onOpenAddResources: () => void;
  onOpenSyllabus?: () => void;
}

export const SubjectResourcesDashboard: React.FC<Props> = ({
  onBack,
  onSelectSubjectResources,
  onOpenStudyPlanner,
  onOpenAddResources,
  onOpenSyllabus,
}) => {
  const [stats, setStats] = useState<{
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
  const [isInstalling, setIsInstalling] = useState(false);
  const [notice, setNotice] = useState<{ text: string; isError?: boolean } | null>(null);

  const loadStats = async () => {
    try {
      const res = await getResourceStats();
      setStats(res);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadStats();
    const unsub = onResourcesChange(() => {
      getResourceStats().then(setStats).catch(() => {});
    });
    return () => unsub();
  }, []);

  /**
   * User Requirement:
   * "डाउनलोड रिसोर्स से मेरा मतलब है जो छह पीडीएफ मैंने दिए हैं वो डाउनलोड करें तो वो अपने-अपने सब्जेक्ट के हिसाब से उस सेक्शन में ऑटोमैटिक चले जाए।"
   */
  const handleDownloadResourcesIntoApp = async () => {
    setIsInstalling(true);
    try {
      const res = await installAllPrebundledResources(true);
      const fresh = await getResourceStats();
      setStats(fresh);

      setNotice({
        text: `सफलता! ${res.installedCount || 6} विषयों के नए हैंड-रिटन PDF रिसोर्सेज आपके संबंधित सेक्शन में लोड हो गए हैं!`,
      });
      setTimeout(() => setNotice(null), 4500);
    } catch (e) {
      console.error('Install resources error:', e);
      setNotice({
        text: 'रिसोर्सेज लोड करने में त्रुटि हुई। कृपया दोबारा प्रयास करें।',
        isError: true,
      });
      setTimeout(() => setNotice(null), 4000);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleClearAllResources = async () => {
    try {
      await clearAllResources();
      const fresh = await getResourceStats();
      setStats(fresh);
      setNotice({
        text: 'सभी पुराने रिसोर्सेज हटा दिए गए हैं। अब आप "डाउनलोड रिसोर्सेज" या "Upload ZIP / PDFs" से नए रिसोर्सेज लोड कर सकते हैं।',
      });
      setTimeout(() => setNotice(null), 4500);
    } catch {
      setNotice({ text: 'रिसोर्सेज हटाने में त्रुटि हुई।', isError: true });
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleExportZipToDevice = async () => {
    if (stats.totalCount === 0) {
      setNotice({
        text: 'पहले "डाउनलोड रिसोर्सेज" या "Upload ZIP / PDFs" से रिसोर्सेज जोड़ें।',
        isError: true,
      });
      setTimeout(() => setNotice(null), 3000);
      return;
    }
    await downloadAllResourcesZip();
  };

  const getSubjectIcon = (iconName: string, color: string) => {
    const props = { className: 'w-6 h-6', style: { color } };
    switch (iconName) {
      case 'Zap':
        return <Zap {...props} />;
      case 'FlaskConical':
        return <FlaskConical {...props} />;
      case 'Calculator':
        return <Calculator {...props} />;
      case 'Dna':
        return <Dna {...props} />;
      case 'BookOpenText':
        return <BookOpenText {...props} />;
      case 'Palette':
        return <Palette {...props} />;
      default:
        return <BookOpen {...props} />;
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition self-start group"
        >
          <ChevronLeft className="w-4 h-4 text-indigo-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Main "डाउनलोड रिसोर्सेज" Button: Adds 6 Curated PDFs straight into their app subject sections */}
          <button
            onClick={handleDownloadResourcesIntoApp}
            disabled={isInstalling}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition active:scale-95"
            title="Download & Add the 6 Handwritten PDFs automatically into their respective Subject Sections"
          >
            {isInstalling ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>डाउनलोड रिसोर्सेज (Download Resources)</span>
          </button>

          {/* Upload Custom PDF or ZIP Archives Button */}
          <button
            onClick={onOpenAddResources}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
            title="Upload custom handwritten PDFs or ZIP archives (.zip) — auto-assigned to subjects"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Upload ZIP / PDFs</span>
          </button>

          {/* Syllabus Quick Button */}
          {onOpenSyllabus && (
            <button
              onClick={onOpenSyllabus}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>Syllabus</span>
            </button>
          )}

          {/* Study Checklist Planner */}
          <button
            onClick={() => onOpenStudyPlanner()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
          >
            <span>Study Planner</span>
          </button>
        </div>
      </div>

      {/* Notice Message */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            notice.isError
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
          }`}
        >
          {notice.isError ? (
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Hero Banner */}
      <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Prepium • 100% Offline • Original Handwritten PDFs</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Subject Resources Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Your Class 12 notes, derivations, and formulas are organized by subject. Click <strong>“डाउनलोड रिसोर्सेज”</strong> above to populate the six curated PDFs directly into their sections, or upload your own files!
            </p>
          </div>

          <div className="flex-shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 min-w-[190px] text-right">
            <div className="text-2xl font-black text-amber-300">{stats.totalCount}</div>
            <div className="text-xs font-semibold text-slate-200">Active Handwritten PDFs</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {(stats.totalSize / 1024 / 1024).toFixed(1)} MB in device IndexedDB
            </div>
            {stats.totalCount > 0 && (
              <div className="mt-2 flex items-center gap-2 justify-end">
                <button
                  onClick={handleExportZipToDevice}
                  className="text-[10px] text-indigo-300 hover:text-white flex items-center gap-1 transition"
                  title="Export all stored PDFs as ZIP to device"
                >
                  <Archive className="w-3 h-3" />
                  <span>Export ZIP</span>
                </button>
                <span className="text-slate-500">•</span>
                <button
                  onClick={handleClearAllResources}
                  className="text-[10px] text-rose-300 hover:text-rose-100 flex items-center gap-1 transition"
                  title="Remove old resources to upload/load new ones"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Exactly Six Subject Sections Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Class 12 Subjects (6 Sections)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any subject to view its handwritten PDFs in Chrome-style continuous scroll
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SUBJECTS.map((sub) => {
            const count = stats.bySubject[sub.id] || 0;
            const hasResources = count > 0;

            return (
              <div
                key={sub.id}
                onClick={() => onSelectSubjectResources(sub.id)}
                className="group relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Subject Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                        style={{ backgroundColor: `${sub.color}15` }}
                      >
                        {getSubjectIcon(sub.iconName, sub.color)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {sub.name}
                          </h4>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {sub.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {sub.hindiName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">
                    {sub.description}
                  </p>
                </div>

                {/* Resource Count Status & Navigation */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileText
                      className={`w-4 h-4 ${hasResources ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'}`}
                    />
                    <span
                      className={`text-xs font-bold ${
                        hasResources
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {hasResources ? `${count} PDF Document${count > 1 ? 's' : ''}` : 'No Resources Added Yet'}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1">
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
