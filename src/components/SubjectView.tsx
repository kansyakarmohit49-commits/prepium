import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  Filter,
  ArrowLeft,
  Sparkles,
  BookOpen,
  HelpCircle,
  RotateCcw,
  CheckCheck,
  Tag,
} from 'lucide-react';
import { SubjectId, UserProgressData, TaskType, Chapter } from '../types/planner';
import { SUBJECTS, CHAPTERS, TASK_DEFINITIONS } from '../data/cbse12Data';
import {
  toggleTask,
  setAllChapterTasks,
  setChapterNote,
  calculateChapterProgress,
  calculateSubjectProgress,
} from '../utils/dataStore';

interface SubjectViewProps {
  subjectId: SubjectId;
  progressData: UserProgressData;
  targetChapterId?: string;
  onBack: () => void;
  onSwitchSubject: (id: SubjectId) => void;
}

export const SubjectView: React.FC<SubjectViewProps> = ({
  subjectId,
  progressData,
  targetChapterId,
  onBack,
  onSwitchSubject,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [notesState, setNotesState] = useState<Record<string, string>>(progressData.notes || {});
  const highlightedRef = useRef<HTMLDivElement | null>(null);

  const subject = SUBJECTS.find((s) => s.id === subjectId) || SUBJECTS[0];
  const subjectChapters = CHAPTERS.filter((c) => c.subjectId === subjectId);
  const subjectProgress = calculateSubjectProgress(subjectId, progressData.tasks);

  // Sync notes from prop
  useEffect(() => {
    setNotesState(progressData.notes || {});
  }, [progressData.notes]);

  // Scroll to target chapter if specified
  useEffect(() => {
    if (targetChapterId && highlightedRef.current) {
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [targetChapterId]);

  const handleToggleTask = (chapterId: string, taskId: TaskType) => {
    const key = `${chapterId}_${taskId}`;
    const wasChecked = !!progressData.tasks[key];

    // Trigger toggle in datastore
    toggleTask(chapterId, taskId);

    // If it was the 5th task and is now checked, trigger celebration confetti!
    if (!wasChecked) {
      const chProgress = calculateChapterProgress(chapterId, {
        ...progressData.tasks,
        [key]: true,
      });
      if (chProgress.isComplete) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: [subject.color, '#10b981', '#f59e0b', '#6366f1'],
        });
      }
    }
  };

  const handleToggleAll = (chapterId: string) => {
    const chProgress = calculateChapterProgress(chapterId, progressData.tasks);
    const markAll = !chProgress.isComplete;
    setAllChapterTasks(chapterId, markAll);

    if (markAll) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: [subject.color, '#10b981', '#3b82f6'],
      });
    }
  };

  const handleNoteChange = (chapterId: string, value: string) => {
    setNotesState((prev) => ({ ...prev, [chapterId]: value }));
    setChapterNote(chapterId, value);
  };

  const toggleNoteExpand = (chapterId: string) => {
    setExpandedNotes((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  // Filter chapters
  const filteredChapters = subjectChapters.filter((ch) => {
    const chProgress = calculateChapterProgress(ch.id, progressData.tasks);

    if (filterStatus === 'completed' && !chProgress.isComplete) return false;
    if (filterStatus === 'pending' && chProgress.isComplete) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ch.title.toLowerCase().includes(q);
      const matchUnit = ch.unit.toLowerCase().includes(q);
      const matchTopic = ch.keyTopics.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchUnit && !matchTopic) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Subject Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {SUBJECTS.map((sub) => {
          const isSelected = sub.id === subjectId;
          const prog = calculateSubjectProgress(sub.id, progressData.tasks);
          return (
            <button
              key={sub.id}
              onClick={() => onSwitchSubject(sub.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm border-slate-900 dark:border-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{sub.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected
                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {prog.percent}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Hero Subject Header */}
      <section
        className="rounded-2xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${subject.color}dd 0%, ${subject.color}99 100%), #0f172a`,
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
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
              {subject.name}
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              {subject.description}
            </p>
          </div>

          {/* Subject Progress Meter */}
          <div className="flex-shrink-0 bg-black/25 backdrop-blur-md p-4 rounded-xl border border-white/15 min-w-[220px]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white/90">Subject Completion</span>
              <span className="text-xl font-black text-white">{subjectProgress.percent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${Math.max(subjectProgress.percent, 3)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/80 mt-2">
              <span>{subjectProgress.completedChapters} / {subjectProgress.totalChapters} Chapters Done</span>
              <span>{subjectProgress.completedTasks} / {subjectProgress.totalTasks} Tasks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${subject.name} chapters or topics...`}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
              filterStatus === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All ({subjectChapters.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
              filterStatus === 'pending'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
              filterStatus === 'completed'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Completed ({subjectProgress.completedChapters})
          </button>
        </div>
      </section>

      {/* Chapter List */}
      <section className="space-y-4">
        {filteredChapters.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No chapters match your filter
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Try changing the search query or reset filters.
            </p>
          </div>
        ) : (
          filteredChapters.map((ch) => {
            const chProg = calculateChapterProgress(ch.id, progressData.tasks);
            const isHighlighted = targetChapterId === ch.id;
            const isNoteOpen = !!expandedNotes[ch.id];
            const currentNote = notesState[ch.id] || '';

            return (
              <div
                key={ch.id}
                ref={isHighlighted ? highlightedRef : null}
                className={`rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 overflow-hidden shadow-sm ${
                  isHighlighted
                    ? 'ring-2 ring-indigo-500 border-indigo-400 shadow-indigo-500/10'
                    : chProg.isComplete
                    ? 'border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Chapter Card Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: `${subject.color}15`,
                            color: subject.color,
                          }}
                        >
                          Chapter {ch.chNumber}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {ch.unit}
                        </span>
                        {ch.estimatedMarks && (
                          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                            {ch.estimatedMarks}
                          </span>
                        )}
                        {isHighlighted && (
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 animate-pulse">
                            Current Focus
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {ch.title}
                      </h3>
                    </div>

                    {/* Quick action buttons & Chapter Progress pill */}
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                            chProg.isComplete
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {chProg.isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          {chProg.completedCount} / 5 Done ({chProg.percent}%)
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleAll(ch.id)}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                        title={chProg.isComplete ? 'Reset chapter checklist' : 'Mark all 5 tasks complete'}
                      >
                        {chProg.isComplete ? 'Reset' : 'Mark All'}
                      </button>
                    </div>
                  </div>

                  {/* Key Topics Badges */}
                  {ch.keyTopics.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      <Tag className="w-3 h-3 text-slate-400" />
                      {ch.keyTopics.map((topic, i) => (
                        <span
                          key={i}
                          className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-md"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5-Task Checklist Section */}
                <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2.5 uppercase tracking-wider">
                    Chapter Tasks Checklist (5 Steps)
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                    {TASK_DEFINITIONS.map((taskDef, index) => {
                      const taskKey = `${ch.id}_${taskDef.id}`;
                      const isChecked = !!progressData.tasks[taskKey];

                      return (
                        <div
                          key={taskDef.id}
                          onClick={() => handleToggleTask(ch.id, taskDef.id)}
                          className={`relative p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                            isChecked
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 shadow-sm'
                              : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isChecked
                                  ? 'bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              Step {index + 1}
                            </span>

                            <div className="flex-shrink-0">
                              {isChecked ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-indigo-500" />
                              )}
                            </div>
                          </div>

                          <div className="mt-2">
                            <h4
                              className={`text-xs font-bold leading-tight ${
                                isChecked
                                  ? 'text-emerald-900 dark:text-emerald-200 line-through opacity-80'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {taskDef.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {taskDef.description}
                            </p>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-[9px]">
                            <span
                              className={`font-semibold ${
                                isChecked
                                  ? 'text-emerald-700 dark:text-emerald-300'
                                  : 'text-slate-400'
                              }`}
                            >
                              {isChecked ? 'Completed ✓' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Notes / Formula Highlights Accordion */}
                  <div className="mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                    <button
                      onClick={() => toggleNoteExpand(ch.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>
                        {currentNote.trim()
                          ? 'Chapter Notes & Formulas (Saved)'
                          : 'Add Chapter Revision Notes / Weak Areas'}
                      </span>
                      {isNoteOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {isNoteOpen && (
                      <div className="mt-2 animate-in fade-in duration-200">
                        <textarea
                          value={currentNote}
                          onChange={(e) => handleNoteChange(ch.id, e.target.value)}
                          placeholder="Write important formulas, tricky derivations, past mistakes or teacher tips for this chapter..."
                          rows={3}
                          className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 px-1">
                          <span>Auto-saved to offline DataStore</span>
                          <span>{currentNote.length} characters</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};
