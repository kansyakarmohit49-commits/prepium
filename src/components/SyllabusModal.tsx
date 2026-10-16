import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Award,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  Zap,
  FlaskConical,
  Calculator,
  Dna,
  BookOpenText,
  Palette,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { SubjectId } from '../types/planner';
import { SUBJECTS } from '../data/cbse12Data';
import {
  SYLLABUS_DATA,
  SyllabusSubject,
  SyllabusChapter,
  getSyllabusBySubject,
  getSyllabusCompletionMap,
  toggleSyllabusChapterCompletion,
  getSyllabusSubjectProgress,
  onSyllabusChange,
} from '../data/cbseSyllabusData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialSubjectId?: SubjectId;
}

export const SyllabusModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialSubjectId = 'physics',
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId>(initialSubjectId);
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [completionMap, setCompletionMap] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'syllabus' | 'assessment'>('syllabus');
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubjectId(initialSubjectId);
    }
  }, [initialSubjectId, isOpen]);

  useEffect(() => {
    setCompletionMap(getSyllabusCompletionMap());
    const unsub = onSyllabusChange(() => {
      setCompletionMap(getSyllabusCompletionMap());
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const currentSubject = SUBJECTS.find((s) => s.id === selectedSubjectId) || SUBJECTS[0];
  const syllabusData = getSyllabusBySubject(selectedSubjectId);
  const progress = getSyllabusSubjectProgress(selectedSubjectId);

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const handleToggleCompletion = (chapterNumber: number) => {
    toggleSyllabusChapterCompletion(selectedSubjectId, chapterNumber);
  };

  const getSubjectIcon = (iconName: string, color: string) => {
    const props = { className: 'w-4 h-4', style: { color } };
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  CBSE Class 12 Syllabus (2026–27)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Official Research
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Expandable units, topics, derivations, numerical focus, and official marks breakdown
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subject Selection Tabs (All 6 Subjects, preserving English Core) */}
        <div className="px-3 sm:px-5 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {SUBJECTS.map((sub) => {
            const isSelected = sub.id === selectedSubjectId;
            return (
              <button
                key={sub.id}
                onClick={() => {
                  setSelectedSubjectId(sub.id);
                  setSearchFilter('');
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {getSubjectIcon(sub.iconName, isSelected ? '#ffffff' : sub.color)}
                <span>{sub.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {sub.code}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Info & Filter Bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('syllabus')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                activeTab === 'syllabus'
                  ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Units &amp; Chapters ({syllabusData ? syllabusData.units.reduce((acc, u) => acc + u.chapters.length, 0) : 0})
            </button>
            <button
              onClick={() => setActiveTab('assessment')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                activeTab === 'assessment'
                  ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Assessment Scheme ({currentSubject.theoryMarks}+{currentSubject.practicalMarks} Marks)
            </button>
          </div>

          {/* Subject syllabus completion pill */}
          {syllabusData && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Syllabus Progress:</span>
              <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {progress.completedChapters}/{progress.totalChapters} Ch ({progress.percent}%)
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Important CBSE Disclaimer Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <p className="font-bold">CBSE 2026–27 Research Disclaimer:</p>
              <p className="text-[11px] opacity-90">
                This syllabus dataset is partially verified from official draft specifications. Official syllabus requirements are strictly distinguished from analytical guidance.
                <strong> Note: Never skip any chapter based on analytical priority labels.</strong>
              </p>
            </div>
          </div>

          {/* Assessment Scheme Tab */}
          {activeTab === 'assessment' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900/60 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-500" />
                  <span>{currentSubject.name} Examination Blueprint (Code {currentSubject.code})</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Theory Exam</span>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                      {currentSubject.theoryMarks} Marks
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">3 Hours Board Examination</p>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">
                      {currentSubject.id === 'mathematics' ? 'Internal Assessment' : 'Practical Exam'}
                    </span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {currentSubject.practicalMarks} Marks
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {currentSubject.id === 'mathematics' ? 'Periodic tests & lab records' : 'Lab experiments, project & viva'}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Weightage</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {currentSubject.theoryMarks + currentSubject.practicalMarks} Marks
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">100% Comprehensive Evaluation</p>
                  </div>
                </div>

                {syllabusData?.assessmentStructure && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <p>
                      <strong className="text-slate-900 dark:text-white">Question Paper Design: </strong>
                      {syllabusData.assessmentStructure.questionPaperDesign}
                    </p>
                    {syllabusData.assessmentStructure.practical && (
                      <p>
                        <strong className="text-slate-900 dark:text-white">Practical Evaluation Breakup: </strong>
                        {syllabusData.assessmentStructure.practical}
                      </p>
                    )}
                    {syllabusData.assessmentStructure.internalAssessment && (
                      <p>
                        <strong className="text-slate-900 dark:text-white">Internal Breakup: </strong>
                        {syllabusData.assessmentStructure.internalAssessment}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Syllabus Units and Chapters Tab */}
          {activeTab === 'syllabus' && (
            <div className="space-y-4">
              {/* Preserved Sixth Subject Empty State */}
              {!syllabusData ? (
                <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Syllabus Data Not Provided Yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Official research syllabus dataset for <strong>{currentSubject.name}</strong> was not included in the five specialized research documents. Existing chapters and 5-task checklist are preserved under the Study Planner.
                  </p>
                  <div className="inline-block text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    Status: Not verified yet
                  </div>
                </div>
              ) : (
                /* Five Subjects with Structured Syllabus */
                <div className="space-y-3">
                  {syllabusData.units.map((unit, uIdx) => {
                    const unitKey = `unit_${uIdx}`;
                    const isUnitOpen = expandedUnits[unitKey] !== false; // default open

                    return (
                      <div
                        key={unitKey}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
                      >
                        {/* Unit Header */}
                        <div
                          onClick={() => toggleUnit(unitKey)}
                          className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between gap-3 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-600 text-white uppercase tracking-wider">
                              {unit.unitNumber}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {unit.unitName}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2.5 flex-shrink-0">
                            {unit.officialMarks !== undefined && (
                              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                {unit.officialMarks} Marks
                              </span>
                            )}
                            {isUnitOpen ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Chapters in Unit */}
                        {isUnitOpen && (
                          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {unit.chapters.map((ch) => {
                              const chKey = `${selectedSubjectId}_ch_${ch.chapterNumber}`;
                              const isCompleted = !!completionMap[chKey];
                              const isChapterOpen = expandedChapters[chKey] || false;

                              return (
                                <div key={chKey} className="p-4 space-y-3">
                                  {/* Chapter Title Bar */}
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5 min-w-0">
                                      {/* Completion checkbox */}
                                      <button
                                        onClick={() => handleToggleCompletion(ch.chapterNumber)}
                                        className="mt-0.5 flex-shrink-0 text-slate-400 hover:text-emerald-500 transition"
                                        title={isCompleted ? 'Mark as incomplete' : 'Mark chapter as completed'}
                                      >
                                        {isCompleted ? (
                                          <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                                        ) : (
                                          <Circle className="w-5 h-5" />
                                        )}
                                      </button>

                                      <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs font-black text-slate-400">
                                            Ch {ch.chapterNumber}.
                                          </span>
                                          <h5
                                            className={`text-xs sm:text-sm font-bold ${
                                              isCompleted
                                                ? 'line-through text-slate-400 dark:text-slate-500'
                                                : 'text-slate-900 dark:text-white'
                                            }`}
                                          >
                                            {ch.chapterName}
                                          </h5>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                            {ch.officialStatus}
                                          </span>
                                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                            {ch.priorityAnalytical}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => toggleChapter(chKey)}
                                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 transition"
                                    >
                                      <span>{isChapterOpen ? 'Less' : 'Topics & Details'}</span>
                                      {isChapterOpen ? (
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>

                                  {/* Expanded Topics, Derivations, and Details */}
                                  {isChapterOpen && (
                                    <div className="pl-7 space-y-3 pt-2 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in duration-150">
                                      {/* Core Official Topics */}
                                      <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="font-extrabold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider block">
                                          Official Prescribed Topics:
                                        </span>
                                        <ul className="list-disc pl-4 space-y-1 text-xs">
                                          {ch.coreTopics.map((topic, tIdx) => (
                                            <li key={tIdx} className="leading-relaxed">
                                              {topic}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>

                                      {/* Key Derivations / Proofs */}
                                      {ch.keyDerivations && ch.keyDerivations.length > 0 && (
                                        <div className="space-y-1 bg-indigo-50/50 dark:bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                                          <span className="font-bold text-indigo-700 dark:text-indigo-300 text-[10px] uppercase tracking-wider block">
                                            Core Derivations &amp; Proofs:
                                          </span>
                                          <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                                            {ch.keyDerivations.map((d, dIdx) => (
                                              <li key={dIdx}>{d}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {/* Numerical Focus & Diagrams */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                        {ch.numericalFocus && (
                                          <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                                            <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[10px] uppercase block">
                                              Numerical &amp; Problem Solving:
                                            </span>
                                            <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                                              {ch.numericalFocus}
                                            </p>
                                          </div>
                                        )}

                                        {ch.diagrams && ch.diagrams.length > 0 && (
                                          <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                                            <span className="font-bold text-amber-800 dark:text-amber-300 text-[10px] uppercase block">
                                              Key Diagrams &amp; Graphs:
                                            </span>
                                            <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                                              {ch.diagrams.join(', ')}
                                            </p>
                                          </div>
                                        )}
                                      </div>

                                      {/* Practical Linkage */}
                                      {ch.practicalLinkage && (
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                                          <Award className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                          <span>
                                            <strong>Laboratory Experiment:</strong> {ch.practicalLinkage}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            CBSE Academic Year 2026–27 • Prepium
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition"
          >
            Close Syllabus
          </button>
        </div>
      </div>
    </div>
  );
};
