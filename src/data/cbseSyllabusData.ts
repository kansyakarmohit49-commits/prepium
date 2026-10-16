import syllabusJson from './cbse_class12_syllabus_2026_27.json';
import { SubjectId } from '../types/planner';

export interface SyllabusChapter {
  chapterNumber: number;
  chapterName: string;
  officialStatus: string;
  priorityAnalytical: string;
  coreTopics: string[];
  keyDerivations?: string[];
  numericalFocus?: string;
  diagrams?: string[];
  practicalLinkage?: string;
}

export interface SyllabusUnit {
  unitNumber: string;
  unitName: string;
  officialMarks?: number;
  chapters: SyllabusChapter[];
}

export interface AssessmentStructure {
  theory: string;
  practical?: string;
  internalAssessment?: string;
  questionPaperDesign: string;
}

export interface SyllabusSubject {
  id: SubjectId;
  code: string;
  name: string;
  hindiName: string;
  theoryMarks: number;
  practicalMarks: number;
  totalMarks: number;
  verified: boolean;
  assessmentStructure: AssessmentStructure;
  units: SyllabusUnit[];
}

export interface SyllabusDataset {
  academicSession: string;
  board: string;
  class: number;
  verificationStatus: string;
  disclaimer: string;
  subjects: SyllabusSubject[];
}

export const SYLLABUS_DATA = syllabusJson as SyllabusDataset;

const SYLLABUS_STORAGE_KEY = 'prepium_syllabus_completion_v1';
const SYLLABUS_CHANGE_EVENT = 'prepium_syllabus_change';

/**
 * Get map of completed chapter keys (e.g. "physics_ch_1": true)
 */
export function getSyllabusCompletionMap(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SYLLABUS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Toggle syllabus chapter completion status
 */
export function toggleSyllabusChapterCompletion(subjectId: SubjectId, chapterNumber: number): boolean {
  if (typeof window === 'undefined') return false;
  const key = `${subjectId}_ch_${chapterNumber}`;
  const current = getSyllabusCompletionMap();
  const nextVal = !current[key];
  current[key] = nextVal;
  try {
    localStorage.setItem(SYLLABUS_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent(SYLLABUS_CHANGE_EVENT));
  } catch {
    // Ignore error
  }
  return nextVal;
}

/**
 * Listen for syllabus completion changes
 */
export function onSyllabusChange(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(SYLLABUS_CHANGE_EVENT, cb);
  return () => window.removeEventListener(SYLLABUS_CHANGE_EVENT, cb);
}

/**
 * Calculate syllabus completion stats for a subject
 */
export function getSyllabusSubjectProgress(subjectId: SubjectId): {
  completedChapters: number;
  totalChapters: number;
  percent: number;
} {
  const subject = SYLLABUS_DATA.subjects.find((s) => s.id === subjectId);
  if (!subject) return { completedChapters: 0, totalChapters: 0, percent: 0 };

  const completionMap = getSyllabusCompletionMap();
  let total = 0;
  let done = 0;

  for (const unit of subject.units) {
    for (const ch of unit.chapters) {
      total++;
      if (completionMap[`${subjectId}_ch_${ch.chapterNumber}`]) {
        done++;
      }
    }
  }

  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { completedChapters: done, totalChapters: total, percent };
}

/**
 * Find subject syllabus data
 */
export function getSyllabusBySubject(subjectId: SubjectId): SyllabusSubject | null {
  return SYLLABUS_DATA.subjects.find((s) => s.id === subjectId) || null;
}
