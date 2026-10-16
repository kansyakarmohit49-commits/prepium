import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Trash2,
  RefreshCw,
  FolderPlus,
} from 'lucide-react';
import { SubjectId } from '../types/planner';
import { StoredResource, StagedFileItem } from '../types/resources';
import { SUBJECTS } from '../data/cbse12Data';
import {
  cleanPdfFileName,
  processPdfFirstPage,
  classifySubjectFromContent,
} from '../utils/pdfProcessor';
import { saveResource } from '../utils/resourceStorage';
import JSZip from 'jszip';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: SubjectId;
  onImportComplete?: (count: number) => void;
}

export const AIResourceManagerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultSubjectId,
  onImportComplete,
}) => {
  const [stagedFiles, setStagedFiles] = useState<StagedFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessCount, setSaveSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newItems: StagedFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isZip =
        file.name.toLowerCase().endsWith('.zip') ||
        file.type.includes('zip') ||
        file.type === 'application/x-zip-compressed';
      const isPdf =
        file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

      if (isZip) {
        try {
          const zip = await JSZip.loadAsync(file);
          const zipFilePaths = Object.keys(zip.files);

          for (const relativePath of zipFilePaths) {
            const entry = zip.files[relativePath];
            if (entry.dir) continue;
            // Ignore OS metadata files like __MACOSX
            if (
              !relativePath.toLowerCase().endsWith('.pdf') ||
              relativePath.startsWith('__MACOSX/') ||
              relativePath.includes('/.')
            ) {
              continue;
            }

            const pdfBytes = await entry.async('uint8array');
            // Keep 100% exact original file blob
            const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
            const extractedFileName = relativePath.split('/').pop() || 'document.pdf';
            const pdfFile = new File([pdfBlob], extractedFileName, { type: 'application/pdf' });

            const cleaned = cleanPdfFileName(extractedFileName);
            // Classify with path hints if zip has subject folders e.g. "Physics/Derivations.pdf"
            const preClassification = classifySubjectFromContent(`${relativePath} ${extractedFileName}`);

            newItems.push({
              id: `file_zip_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              file: pdfFile,
              originalName: extractedFileName,
              cleanedName: cleaned,
              fileSize: pdfBlob.size,
              stage: 'pending',
              detectedSubject: defaultSubjectId || preClassification.subjectId,
              confirmedSubject: defaultSubjectId || preClassification.subjectId,
              confidence: preClassification.confidence,
              originalPageCount: 0,
              processedPageCount: 0,
              firstPageRemoved: false,
            });
          }
        } catch (zipErr) {
          console.error('Failed to unpack zip file:', file.name, zipErr);
        }
      } else if (isPdf) {
        const cleaned = cleanPdfFileName(file.name);
        const preClassification = classifySubjectFromContent(file.name);

        newItems.push({
          id: `file_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 6)}`,
          file,
          originalName: file.name,
          cleanedName: cleaned,
          fileSize: file.size,
          stage: 'pending',
          detectedSubject: defaultSubjectId || preClassification.subjectId,
          confirmedSubject: defaultSubjectId || preClassification.subjectId,
          confidence: preClassification.confidence,
          originalPageCount: 0,
          processedPageCount: 0,
          firstPageRemoved: false,
        });
      }
    }

    setStagedFiles((prev) => [...prev, ...newItems]);
    setSaveSuccessCount(null);
  };

  const handleStartProcessing = async () => {
    setIsProcessing(true);

    for (let i = 0; i < stagedFiles.length; i++) {
      const item = stagedFiles[i];
      if (item.stage === 'complete') continue;

      // Update to reading
      setStagedFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, stage: 'reading' } : f))
      );

      try {
        const arrayBuffer = await item.file.arrayBuffer();

        // Update to analyzing
        setStagedFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, stage: 'analyzing' } : f))
        );

        // Process first page & extract text without altering PDF bytes
        const result = await processPdfFirstPage(arrayBuffer, item.originalName, item.file);

        // Re-classify using full extracted text
        const classification = classifySubjectFromContent(
          item.originalName,
          result.extractedText
        );

        // Set as complete with original blob
        setStagedFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  stage: 'complete',
                  processedBlob: item.file,
                  originalPageCount: result.originalPageCount,
                  processedPageCount: result.processedPageCount,
                  firstPageRemoved: false,
                  detectedSubject: classification.subjectId,
                  confirmedSubject: defaultSubjectId || classification.subjectId,
                  confidence: classification.confidence,
                }
              : f
          )
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Processing error';
        setStagedFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, stage: 'error', error: msg } : f
          )
        );
      }
    }

    setIsProcessing(false);
  };

  const handleSaveAll = async () => {
    const readyItems = stagedFiles.filter(
      (f) => f.stage === 'complete' && f.processedBlob
    );
    if (readyItems.length === 0) return;

    setIsSaving(true);
    let count = 0;

    for (const item of readyItems) {
      const stored: StoredResource = {
        id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
        subjectId: item.confirmedSubject,
        originalName: item.originalName,
        cleanedName: item.cleanedName,
        fileSize: item.processedBlob!.size,
        pageCount: item.processedPageCount,
        originalPageCount: item.originalPageCount,
        firstPageRemoved: item.firstPageRemoved,
        importedAt: new Date().toISOString(),
        fileBlob: item.processedBlob!,
      };

      await saveResource(stored);
      count++;
    }

    setIsSaving(false);
    setSaveSuccessCount(count);
    if (onImportComplete) {
      onImportComplete(count);
    }

    // Clear after delay or give immediate feedback
    setTimeout(() => {
      setStagedFiles([]);
      onClose();
    }, 1500);
  };

  const handleRemoveStaged = (id: string) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdateSubject = (id: string, newSubject: SubjectId) => {
    setStagedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, confirmedSubject: newSubject } : f))
    );
  };

  const handleUpdateCleanedName = (id: string, newName: string) => {
    setStagedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, cleanedName: newName } : f))
    );
  };

  const pendingCount = stagedFiles.filter((f) => f.stage === 'pending').length;
  const completedCount = stagedFiles.filter((f) => f.stage === 'complete').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>AI Resource Manager</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Offline Processor
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Categorize, clean filenames, inspect cover photos, and save to on-device storage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Privacy Guarantee Banner */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              <strong>100% Offline &amp; Private:</strong> Files are processed locally using on-device PDF engine and saved in IndexedDB. Zero cloud uploads.
            </span>
          </div>

          {/* File Picker Drag & Drop Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-300 dark:border-indigo-800/80 hover:border-indigo-500 dark:hover:border-indigo-600 rounded-2xl p-6 text-center cursor-pointer bg-indigo-50/20 dark:bg-indigo-950/20 transition group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.zip,application/pdf,application/zip,application/x-zip-compressed"
              multiple
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Choose PDF or ZIP Files to Import
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Select PDF files or ZIP archives (.zip). All handwritten PDFs inside will be unpacked intact with 0% modification and sorted into their respective subjects!
            </p>
            <button
              type="button"
              className="mt-3 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              Browse PDFs or ZIPs
            </button>
          </div>

          {/* Staged Files List */}
          {stagedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Selected Files ({stagedFiles.length})
                </span>

                {pendingCount > 0 && !isProcessing && (
                  <button
                    onClick={handleStartProcessing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Process &amp; Categorize All</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {stagedFiles.map((item) => {
                  const subjectObj = SUBJECTS.find((s) => s.id === item.confirmedSubject);

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <input
                              type="text"
                              value={item.cleanedName}
                              onChange={(e) => handleUpdateCleanedName(item.id, e.target.value)}
                              className="text-xs font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none w-full max-w-sm truncate"
                              title="Click to edit display title"
                            />
                            <p className="text-[10px] text-slate-400 truncate">
                              Original: {item.originalName} • {(item.fileSize / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveStaged(item.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Processing status & Subject assignment */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Assign to Subject:
                          </span>
                          <select
                            value={item.confirmedSubject}
                            onChange={(e) => handleUpdateSubject(item.id, e.target.value as SubjectId)}
                            className="text-xs font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {SUBJECTS.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.stage === 'reading' && (
                            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse">
                              Reading bytes...
                            </span>
                          )}
                          {item.stage === 'analyzing' && (
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 animate-pulse">
                              Inspecting cover &amp; subject...
                            </span>
                          )}
                          {item.stage === 'complete' && (
                            <>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Original Handwritten PDF (Intact)
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {item.processedPageCount} Pages Ready
                              </span>
                            </>
                          )}
                          {item.stage === 'error' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                              Error: {item.error}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Success Banner */}
          {saveSuccessCount !== null && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Successfully saved {saveSuccessCount} resource{saveSuccessCount > 1 ? 's' : ''} to local storage!
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {completedCount > 0
              ? `${completedCount} file(s) ready to save locally`
              : `${stagedFiles.length} file(s) selected`}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            {pendingCount > 0 ? (
              <button
                onClick={handleStartProcessing}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Locally...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Process &amp; Preview</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSaveAll}
                disabled={completedCount === 0 || isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold shadow-xs transition"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to Storage...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save to Subject Resources</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
