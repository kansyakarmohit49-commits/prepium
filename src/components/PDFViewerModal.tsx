import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronUp,
  ChevronDown,
  Maximize2,
  FileText,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Search,
} from 'lucide-react';
import { StoredResource } from '../types/resources';
import { SUBJECTS } from '../data/cbse12Data';

try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
} catch (e) {
  console.warn('PDF.js worker setup warning:', e);
}

interface PDFViewerModalProps {
  resource: StoredResource | null;
  onClose: () => void;
}

interface PageItemProps {
  doc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  zoomScale: number;
  containerWidth: number;
  onVisible: (pageNumber: number) => void;
}

const PDFPageCard: React.FC<PageItemProps> = ({
  doc,
  pageNumber,
  zoomScale,
  containerWidth,
  onVisible,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [pageDim, setPageDim] = useState<{ width: number; height: number }>({ width: 600, height: 850 });
  const renderTaskRef = useRef<any>(null);

  // Observer to render only when page comes near viewport (Virtualization for fast performance)
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          onVisible(pageNumber);
          renderPage();
        }
      },
      { rootMargin: '300px 0px 300px 0px', threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [doc, pageNumber, zoomScale, containerWidth]);

  const renderPage = async () => {
    if (isRendering || !doc) return;
    setIsRendering(true);

    try {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // Ignored
        }
      }

      const page = await doc.getPage(pageNumber);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const baseViewport = page.getViewport({ scale: 1 });
      const availableWidth = Math.max(320, containerWidth - 48);
      const fitScale = (availableWidth / baseViewport.width) * (zoomScale / 1.0);
      const effectiveScale = Math.max(0.6, fitScale);

      const viewport = page.getViewport({ scale: effectiveScale });
      setPageDim({ width: Math.floor(viewport.width), height: Math.floor(viewport.height) });

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const task = page.render({
        canvasContext: context,
        viewport,
      });

      renderTaskRef.current = task;
      await task.promise;
      setIsRendered(true);
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error(`Page ${pageNumber} render error:`, err);
      }
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div
      ref={cardRef}
      id={`pdf-page-${pageNumber}`}
      className="relative flex flex-col items-center my-3 transition-transform"
      style={{ minHeight: `${pageDim.height}px` }}
    >
      <div className="relative bg-white rounded-lg shadow-xl border border-slate-700/60 overflow-hidden">
        <canvas ref={canvasRef} className="block mx-auto" />
        {!isRendered && (
          <div
            className="flex items-center justify-center bg-slate-800/40 text-slate-400 text-xs font-medium"
            style={{ width: `${pageDim.width}px`, height: `${pageDim.height}px` }}
          >
            <span>Loading Page {pageNumber}...</span>
          </div>
        )}
      </div>
      <div className="mt-1.5 text-[10px] text-slate-400 font-semibold select-none">
        Page {pageNumber}
      </div>
    </div>
  );
};

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({ resource, onClose }) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [visiblePage, setVisiblePage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      if (scrollContainerRef.current) {
        setContainerWidth(scrollContainerRef.current.clientWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load PDF Document
  useEffect(() => {
    if (!resource || !resource.fileBlob) {
      setPdfDoc(null);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setErrorMsg(null);
    setVisiblePage(1);

    (async () => {
      try {
        const arrayBuffer = await resource.fileBlob.arrayBuffer();
        if (isCancelled) return;

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (err: unknown) {
        if (isCancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to parse PDF document.';
        console.error('PDF.js load error:', err);
        setErrorMsg(msg);
        setLoading(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [resource]);

  if (!resource) return null;

  const subject = SUBJECTS.find((s) => s.id === resource.subjectId) || SUBJECTS[0];

  const handleDownload = () => {
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

  const handleOpenNewTab = () => {
    if (!resource.fileBlob) return;
    const url = URL.createObjectURL(resource.fileBlob);
    window.open(url, '_blank');
  };

  const handleScrollToPage = (targetP: number) => {
    const safe = Math.max(1, Math.min(numPages, targetP));
    const targetEl = document.getElementById(`pdf-page-${safe}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(2.5, prev + 0.2));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(0.6, prev - 0.2));
  };

  const handleResetZoom = () => {
    setZoomScale(1.0);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200">
      {/* Top Fixed App Bar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between gap-3 text-white flex-shrink-0 shadow-lg">
        {/* Left: Close & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold"
            title="Back to Subject Resources"
          >
            <X className="w-5 h-5" />
            <span className="hidden sm:inline">Close</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${subject.color}25`, color: subject.color }}
              >
                {subject.name}
              </span>
              <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                {resource.cleanedName}
              </h2>
            </div>
            <p className="text-[10px] text-slate-400">
              {numPages} Pages • {(resource.fileSize / 1024 / 1024).toFixed(2)} MB • Continuous Scroll
            </p>
          </div>
        </div>

        {/* Center: Live Page Position Floating Pill */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1 rounded-xl border border-slate-700">
          <button
            onClick={() => handleScrollToPage(visiblePage - 1)}
            disabled={visiblePage <= 1}
            className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30"
            title="Scroll to previous page"
          >
            <ChevronUp className="w-4 h-4" />
          </button>

          <div className="text-xs font-bold text-slate-200">
            <span>Page {visiblePage}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span>{numPages}</span>
          </div>

          <button
            onClick={() => handleScrollToPage(visiblePage + 1)}
            disabled={visiblePage >= numPages}
            className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30"
            title="Scroll to next page"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Zoom & Download Controls */}
        <div className="flex items-center gap-1.5">
          {/* Zoom controls */}
          <div className="hidden md:flex items-center bg-slate-800/90 rounded-xl p-0.5 border border-slate-700">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 text-[11px] font-semibold text-slate-300 hover:text-white"
              title="Reset Zoom to 100%"
            >
              {Math.round(zoomScale * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition active:scale-95 shadow-xs"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Open in new tab fallback */}
          <button
            onClick={handleOpenNewTab}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Open in Browser Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Continuous Scroll Area (Exactly like Chrome PDF viewer) */}
      <div
        ref={scrollContainerRef}
        className="flex-1 w-full overflow-y-auto overflow-x-hidden bg-slate-900/60 p-2 sm:p-4 scroll-smooth"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <RefreshCw className="w-9 h-9 text-indigo-500 animate-spin mb-3" />
            <h3 className="text-sm font-bold text-white">Opening PDF in Scroll View...</h3>
            <p className="text-xs text-slate-400 mt-1">
              Preparing all {resource.pageCount} pages for smooth vertical scrolling.
            </p>
          </div>
        ) : errorMsg ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-white">Unable to render PDF</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">{errorMsg}</p>
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                Download PDF File
              </button>
              <button
                onClick={handleOpenNewTab}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-200 text-xs font-semibold"
              >
                Open in Tab
              </button>
            </div>
          </div>
        ) : pdfDoc ? (
          <div className="max-w-4xl mx-auto flex flex-col items-center pb-12">
            {Array.from({ length: numPages }).map((_, idx) => (
              <PDFPageCard
                key={idx + 1}
                doc={pdfDoc}
                pageNumber={idx + 1}
                zoomScale={zoomScale}
                containerWidth={containerWidth}
                onVisible={(p) => setVisiblePage(p)}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Bottom Sticky Status Bar */}
      <div className="h-8 bg-slate-950 border-t border-slate-800/80 px-4 flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>Smooth Vertical Scroll Active • {numPages} Total Pages</span>
        </span>

        <span className="font-semibold text-slate-300">
          Showing Page {visiblePage} of {numPages}
        </span>
      </div>
    </div>
  );
};
