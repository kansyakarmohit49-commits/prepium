import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  FileText,
  Download,
  BookOpen,
  FolderPlus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { SubjectId } from '../types/planner';
import { StoredResource } from '../types/resources';
import { SUBJECTS } from '../data/cbse12Data';
import {
  getResourcesBySubject,
  deleteResource,
  onResourcesChange,
} from '../utils/resourceStorage';

interface Props {
  subjectId: SubjectId;
  onBackToDashboard: () => void;
  onOpenViewer: (resource: StoredResource) => void;
  onOpenAddResources: (defaultSubId?: SubjectId) => void;
  onOpenStudyPlanner: (subjectId: SubjectId) => void;
  onOpenSyllabus?: (subjectId: SubjectId) => void;
}

export const SubjectResourcesView: React.FC<Props> = ({
  subjectId,
  onBackToDashboard,
  onOpenViewer,
  onOpenAddResources,
  onOpenStudyPlanner,
  onOpenSyllabus,
}) => {
  const [resources, setResources] = useState<StoredResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const subject = SUBJECTS.find((s) => s.id === subjectId) || SUBJECTS[0];

  const loadSubjectResources = async () => {
    setLoading(true);
    try {
      const list = await getResourcesBySubject(subjectId);
      setResources(list);
    } catch {
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjectResources();
    const unsub = onResourcesChange(() => {
      loadSubjectResources();
    });
    return () => unsub();
  }, [subjectId]);

  const handleDownload = (resource: StoredResource) => {
    if (!resource.fileBlob) return;
    const url = URL.createObjectURL(resource.fileBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resource.cleanedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    await deleteResource(id);
    setDeletingId(null);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition self-start group"
        >
          <ChevronLeft className="w-4 h-4 text-indigo-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Resources Dashboard</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onOpenAddResources(subjectId)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Add PDF / ZIP to {subject.name}</span>
          </button>

          {onOpenSyllabus && (
            <button
              onClick={() => onOpenSyllabus(subjectId)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>CBSE Syllabus</span>
            </button>
          )}

          <button
            onClick={() => onOpenStudyPlanner(subjectId)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
          >
            <Layers className="w-4 h-4" />
            <span>Open Study Planner</span>
          </button>
        </div>
      </div>

      {/* Subject Header Banner */}
      <section
        className="rounded-2xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${subject.color}dd 0%, ${subject.color}99 100%), #0f172a`,
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-black/30 backdrop-blur-sm text-white border border-white/20">
                CBSE Code {subject.code}
              </span>
              <span className="text-[11px] font-semibold text-white/80">
                {subject.hindiName}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {subject.name} Resources
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              Locally saved handwritten notes, derivations, and formulas. PDF contents are preserved byte-for-byte.
            </p>
          </div>

          <div className="flex-shrink-0 bg-black/25 backdrop-blur-md p-3.5 rounded-xl border border-white/15 min-w-[170px] text-right">
            <div className="text-2xl font-black text-white">{resources.length}</div>
            <div className="text-xs font-medium text-white/80">Active PDF Documents</div>
            <div className="text-[10px] text-white/70 mt-0.5">Available 100% Offline</div>
          </div>
        </div>
      </section>

      {/* Resource List / Strict Empty State */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Available Documents ({resources.length})
          </h3>
          <span className="text-xs text-slate-400">
            Offline on-device storage • Prepium
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading resources...</p>
          </div>
        ) : resources.length === 0 ? (
          /* Strict requirement: Keep empty until resources are added! */
          <div className="p-10 sm:p-14 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No Resources Added Yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                No PDF resources have been imported for {subject.name} yet. When you add handwritten PDFs through the AI Resource Manager or click “डाउनलोड रिसोर्सेज” on the dashboard, they will appear here automatically.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => onOpenAddResources(subjectId)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Upload PDF / ZIP</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${subject.color}15` }}
                  >
                    <FileText className="w-5 h-5" style={{ color: subject.color }} />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.cleanedName}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.pageCount} Pages
                      </span>
                      <span>•</span>
                      <span>{(item.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                      <span>•</span>
                      <span className="text-[11px]">
                        Imported {new Date(item.importedAt).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Original PDF Intact
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onOpenViewer(item)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
                    title="Open PDF in Chrome-style continuous scroll viewer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </button>

                  <button
                    onClick={() => handleDownload(item)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition active:scale-95"
                    title="Download exact uploaded PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Download</span>
                  </button>

                  {deletingId === item.id ? (
                    <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-xl border border-rose-200 dark:border-rose-800">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2 py-1 text-slate-500 text-[10px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 transition"
                      title="Delete resource"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
