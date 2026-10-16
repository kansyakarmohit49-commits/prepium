export type SubjectId = 'physics' | 'chemistry' | 'mathematics' | 'biology' | 'english' | 'painting';

export type TaskType = 'theory' | 'revision' | 'moduleNcert' | 'pyq' | 'finalRevision';

export interface TaskDefinition {
  id: TaskType;
  title: string;
  hindiTitle: string;
  description: string;
  shortLabel: string;
  badge: string;
}

export interface Chapter {
  id: string; // e.g. "phy_ch1"
  subjectId: SubjectId;
  chNumber: number;
  title: string;
  unit: string;
  estimatedMarks?: string;
  keyTopics: string[];
}

export interface Subject {
  id: SubjectId;
  name: string;
  hindiName: string;
  code: string;
  theoryMarks: number;
  practicalMarks: number;
  totalChapters: number;
  totalTasks: number; // totalChapters * 5
  color: string;
  bgLight: string;
  borderLight: string;
  iconName: string;
  description: string;
}

export type TaskProgressMap = Record<string, boolean>; // key: `${chapterId}_${taskId}` -> boolean

export interface UserProgressData {
  version: number;
  tasks: TaskProgressMap;
  lastActiveChapterId?: string;
  lastActiveSubjectId?: SubjectId;
  notes: Record<string, string>; // chapterId -> notes
  studyStreakDays: number;
  lastStudiedDate: string; // YYYY-MM-DD
  theme: 'light' | 'dark' | 'system';
  targetExamYear: string;
  dailyGoalTarget?: number;
  dailyGoalDate?: string;
  completedChaptersToday?: string[];
  chapterCompletionDates?: Record<string, string>;
}
