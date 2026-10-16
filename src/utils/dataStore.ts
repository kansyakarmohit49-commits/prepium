import { UserProgressData, SubjectId, TaskType, TaskProgressMap, Chapter, TaskDefinition } from '../types/planner';
import { CHAPTERS, SUBJECTS, TASK_DEFINITIONS } from '../data/cbse12Data';

const STORAGE_KEY = 'studysphere_12th_datastore_v1';
const EVENT_NAME = 'studysphere_datastore_updated';

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultProgress(): UserProgressData {
  const today = getTodayString();
  return {
    version: 1,
    tasks: {},
    lastActiveChapterId: 'phy_1',
    lastActiveSubjectId: 'physics',
    notes: {},
    studyStreakDays: 1,
    lastStudiedDate: today,
    theme: 'system',
    targetExamYear: '2026-2027',
    dailyGoalTarget: 2,
    dailyGoalDate: today,
    completedChaptersToday: [],
    chapterCompletionDates: {},
  };
}

export function loadDataStore(): UserProgressData {
  if (typeof window === 'undefined') {
    return getDefaultProgress();
  }

  const today = getTodayString();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = getDefaultProgress();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    const parsed = JSON.parse(raw) as UserProgressData;
    if (!parsed || typeof parsed !== 'object') {
      return getDefaultProgress();
    }

    const isSameDay = parsed.dailyGoalDate === today;
    const completionDates = parsed.chapterCompletionDates || {};
    // Extract chapters completed today based on dates or saved list
    const completedToday = isSameDay
      ? parsed.completedChaptersToday || []
      : Object.entries(completionDates)
          .filter(([_, d]) => d === today)
          .map(([cId]) => cId);

    return {
      version: parsed.version || 1,
      tasks: parsed.tasks || {},
      lastActiveChapterId: parsed.lastActiveChapterId || 'phy_1',
      lastActiveSubjectId: parsed.lastActiveSubjectId || 'physics',
      notes: parsed.notes || {},
      studyStreakDays: parsed.studyStreakDays || 1,
      lastStudiedDate: parsed.lastStudiedDate || today,
      theme: parsed.theme || 'system',
      targetExamYear: parsed.targetExamYear || '2026-2027',
      dailyGoalTarget: typeof parsed.dailyGoalTarget === 'number' && parsed.dailyGoalTarget > 0 ? parsed.dailyGoalTarget : 2,
      dailyGoalDate: today,
      completedChaptersToday: completedToday,
      chapterCompletionDates: completionDates,
    };
  } catch (e) {
    console.error('Failed to load DataStore from localStorage:', e);
    return getDefaultProgress();
  }
}

export function saveDataStore(data: UserProgressData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: data }));
  } catch (e) {
    console.error('Failed to save DataStore:', e);
  }
}

export function toggleTask(chapterId: string, taskId: TaskType): UserProgressData {
  const current = loadDataStore();
  const key = `${chapterId}_${taskId}`;
  const currentStatus = !!current.tasks[key];
  const newStatus = !currentStatus;

  const newTasks = {
    ...current.tasks,
    [key]: newStatus,
  };

  const ch = CHAPTERS.find((c) => c.id === chapterId);
  const subjectId = ch ? ch.subjectId : current.lastActiveSubjectId;

  // Streak logic
  const today = getTodayString();
  let streak = current.studyStreakDays || 1;
  if (current.lastStudiedDate !== today && newStatus) {
    const lastDate = new Date(current.lastStudiedDate);
    const currentDate = new Date(today);
    const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      streak += 1;
    } else if (diffDays > 1) {
      streak = 1;
    }
  }

  // Check if chapter is fully completed (5/5 tasks done)
  const taskTypes: TaskType[] = ['theory', 'revision', 'moduleNcert', 'pyq', 'finalRevision'];
  const isChComplete = taskTypes.every((t) => !!newTasks[`${chapterId}_${t}`]);

  let newCompletedToday = [...(current.completedChaptersToday || [])];
  const newCompletionDates = { ...(current.chapterCompletionDates || {}) };

  if (isChComplete) {
    if (!newCompletedToday.includes(chapterId)) {
      newCompletedToday.push(chapterId);
    }
    newCompletionDates[chapterId] = today;
  } else {
    newCompletedToday = newCompletedToday.filter((id) => id !== chapterId);
    delete newCompletionDates[chapterId];
  }

  const updated: UserProgressData = {
    ...current,
    tasks: newTasks,
    lastActiveChapterId: chapterId,
    lastActiveSubjectId: subjectId,
    lastStudiedDate: today,
    studyStreakDays: streak,
    completedChaptersToday: newCompletedToday,
    chapterCompletionDates: newCompletionDates,
  };

  saveDataStore(updated);
  return updated;
}

export function setAllChapterTasks(chapterId: string, completed: boolean): UserProgressData {
  const current = loadDataStore();
  const today = getTodayString();
  const newTasks = { ...current.tasks };
  const taskIds: TaskType[] = ['theory', 'revision', 'moduleNcert', 'pyq', 'finalRevision'];

  taskIds.forEach((tId) => {
    newTasks[`${chapterId}_${tId}`] = completed;
  });

  let newCompletedToday = [...(current.completedChaptersToday || [])];
  const newCompletionDates = { ...(current.chapterCompletionDates || {}) };

  if (completed) {
    if (!newCompletedToday.includes(chapterId)) {
      newCompletedToday.push(chapterId);
    }
    newCompletionDates[chapterId] = today;
  } else {
    newCompletedToday = newCompletedToday.filter((id) => id !== chapterId);
    delete newCompletionDates[chapterId];
  }

  const ch = CHAPTERS.find((c) => c.id === chapterId);
  const updated: UserProgressData = {
    ...current,
    tasks: newTasks,
    lastActiveChapterId: chapterId,
    lastActiveSubjectId: ch ? ch.subjectId : current.lastActiveSubjectId,
    completedChaptersToday: newCompletedToday,
    chapterCompletionDates: newCompletionDates,
  };

  saveDataStore(updated);
  return updated;
}

export function setDailyGoalTarget(target: number): UserProgressData {
  const current = loadDataStore();
  const safeTarget = Math.max(1, Math.min(20, Math.round(target)));
  const updated: UserProgressData = {
    ...current,
    dailyGoalTarget: safeTarget,
  };
  saveDataStore(updated);
  return updated;
}

export function setChapterNote(chapterId: string, noteText: string): void {
  const current = loadDataStore();
  const updated: UserProgressData = {
    ...current,
    notes: {
      ...current.notes,
      [chapterId]: noteText,
    },
  };
  saveDataStore(updated);
}

export function setLastActive(chapterId: string, subjectId: SubjectId): void {
  const current = loadDataStore();
  const updated: UserProgressData = {
    ...current,
    lastActiveChapterId: chapterId,
    lastActiveSubjectId: subjectId,
  };
  saveDataStore(updated);
}

export function setThemeMode(theme: 'light' | 'dark' | 'system'): void {
  const current = loadDataStore();
  const updated = { ...current, theme };
  saveDataStore(updated);
  applyTheme(theme);
}

export function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (theme === 'system') {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (systemPrefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  } else if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function calculateChapterProgress(chapterId: string, tasks: TaskProgressMap) {
  const taskTypes: TaskType[] = ['theory', 'revision', 'moduleNcert', 'pyq', 'finalRevision'];
  let doneCount = 0;
  taskTypes.forEach((tId) => {
    if (tasks[`${chapterId}_${tId}`]) {
      doneCount++;
    }
  });
  return {
    completedCount: doneCount,
    totalCount: 5,
    isComplete: doneCount === 5,
    percent: Math.round((doneCount / 5) * 100),
  };
}

export function calculateSubjectProgress(subjectId: SubjectId, tasks: TaskProgressMap) {
  const subjectChapters = CHAPTERS.filter((c) => c.subjectId === subjectId);
  const totalChapters = subjectChapters.length;
  const totalTasks = totalChapters * 5;
  let completedTasks = 0;
  let completedChapters = 0;

  subjectChapters.forEach((ch) => {
    const prog = calculateChapterProgress(ch.id, tasks);
    completedTasks += prog.completedCount;
    if (prog.isComplete) {
      completedChapters++;
    }
  });

  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  return {
    completedTasks,
    totalTasks,
    percent,
    completedChapters,
    totalChapters,
  };
}

export function calculateOverallProgress(tasks: TaskProgressMap) {
  const totalChapters = CHAPTERS.length; // 86
  const totalTasks = totalChapters * 5; // 430
  let completedTasks = 0;
  let completedChapters = 0;

  CHAPTERS.forEach((ch) => {
    const prog = calculateChapterProgress(ch.id, tasks);
    completedTasks += prog.completedCount;
    if (prog.isComplete) {
      completedChapters++;
    }
  });

  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  return {
    completedTasks,
    totalTasks,
    percent,
    completedChapters,
    totalChapters,
  };
}

export function findNextTaskToContinue(
  data: UserProgressData
): { chapter: Chapter; task: TaskDefinition; subject: (typeof SUBJECTS)[0] } | null {
  const tasks = data.tasks || {};

  // Check last active chapter first if it has incomplete tasks
  if (data.lastActiveChapterId) {
    const activeCh = CHAPTERS.find((c) => c.id === data.lastActiveChapterId);
    if (activeCh) {
      for (const tDef of TASK_DEFINITIONS) {
        if (!tasks[`${activeCh.id}_${tDef.id}`]) {
          const sub = SUBJECTS.find((s) => s.id === activeCh.subjectId)!;
          return { chapter: activeCh, task: tDef, subject: sub };
        }
      }
    }
  }

  // Check preferred last active subject
  const sortedSubjects = [...SUBJECTS];
  if (data.lastActiveSubjectId) {
    const idx = sortedSubjects.findIndex((s) => s.id === data.lastActiveSubjectId);
    if (idx > -1) {
      const [fav] = sortedSubjects.splice(idx, 1);
      sortedSubjects.unshift(fav);
    }
  }

  // Find first incomplete task across chapters
  for (const sub of sortedSubjects) {
    const subChapters = CHAPTERS.filter((c) => c.subjectId === sub.id);
    for (const ch of subChapters) {
      for (const tDef of TASK_DEFINITIONS) {
        if (!tasks[`${ch.id}_${tDef.id}`]) {
          return { chapter: ch, task: tDef, subject: sub };
        }
      }
    }
  }

  // All 430 tasks completed! Return first chapter for revision
  const firstCh = CHAPTERS[0];
  const firstSub = SUBJECTS[0];
  return { chapter: firstCh, task: TASK_DEFINITIONS[0], subject: firstSub };
}

export function exportBackupData(): string {
  const data = loadDataStore();
  return JSON.stringify(data, null, 2);
}

export function importBackupData(jsonContent: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonContent);
    if (!parsed || typeof parsed !== 'object' || !parsed.tasks) {
      return { success: false, message: 'Invalid backup file structure.' };
    }
    const today = getTodayString();
    const cleanData: UserProgressData = {
      version: parsed.version || 1,
      tasks: parsed.tasks || {},
      lastActiveChapterId: parsed.lastActiveChapterId || 'phy_1',
      lastActiveSubjectId: parsed.lastActiveSubjectId || 'physics',
      notes: parsed.notes || {},
      studyStreakDays: parsed.studyStreakDays || 1,
      lastStudiedDate: parsed.lastStudiedDate || today,
      theme: parsed.theme || 'system',
      targetExamYear: parsed.targetExamYear || '2026-2027',
      dailyGoalTarget: typeof parsed.dailyGoalTarget === 'number' && parsed.dailyGoalTarget > 0 ? parsed.dailyGoalTarget : 2,
      dailyGoalDate: today,
      completedChaptersToday: parsed.completedChaptersToday || [],
      chapterCompletionDates: parsed.chapterCompletionDates || {},
    };
    saveDataStore(cleanData);
    return { success: true, message: 'Progress successfully restored!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown parsing error';
    return { success: false, message: `Failed to import JSON: ${msg}` };
  }
}

export function resetAllData(): void {
  const fresh = getDefaultProgress();
  saveDataStore(fresh);
}

export function resetSubjectData(subjectId: SubjectId): void {
  const current = loadDataStore();
  const subChapters = CHAPTERS.filter((c) => c.subjectId === subjectId);
  const chIds = new Set(subChapters.map((c) => c.id));

  const newTasks = { ...current.tasks };
  Object.keys(newTasks).forEach((key) => {
    const chId = key.split('_')[0] + '_' + key.split('_')[1];
    if (chIds.has(chId)) {
      delete newTasks[key];
    }
  });

  const updated = { ...current, tasks: newTasks };
  saveDataStore(updated);
}

export function onDataStoreChange(callback: (data: UserProgressData) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (e: Event) => {
    const custom = e as CustomEvent<UserProgressData>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(loadDataStore());
    }
  };

  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener('storage', handler);
  };
}
