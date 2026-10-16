import { SubjectId } from './planner';

export interface StoredResource {
  id: string; // Unique ID (e.g. res_123456789)
  subjectId: SubjectId;
  originalName: string;
  cleanedName: string;
  fileSize: number; // in bytes
  pageCount: number; // processed page count
  originalPageCount: number;
  firstPageRemoved: boolean; // true if Sobit Nirman cover picture was detected and removed
  importedAt: string; // ISO string
  fileBlob: Blob; // The local processed PDF blob in IndexedDB
}

export type ProcessingStage = 'pending' | 'reading' | 'analyzing' | 'complete' | 'error';

export interface StagedFileItem {
  id: string;
  file: File;
  originalName: string;
  cleanedName: string;
  fileSize: number;
  stage: ProcessingStage;
  error?: string;
  detectedSubject: SubjectId;
  confirmedSubject: SubjectId;
  confidence: number;
  originalPageCount: number;
  processedPageCount: number;
  firstPageRemoved: boolean;
  processedBlob?: Blob;
}
