"use client";

import { useEffect, useRef, useState } from "react";
import type { ExtractedField } from "@/lib/data";
import { type Box, stepZoom, toCanvasBox, ZOOM_MAX, ZOOM_MIN } from "@/lib/pdf-view";

type PdfJs = typeof import("unpdf/pdfjs");
type Doc = Awaited<ReturnType<PdfJs["getDocument"]>["promise"]>;
type Highlight = NonNullable<ExtractedField["highlight"]>;

const NOT_LOCATED = "Không xác định được vị trí câu trích trên trang; hãy tự tìm câu trích hiển thị bên trái.";


/** The pdf.js bundle of unpdf (it carries its own worker), loaded once and only in the browser. */
let pdfjsLoad: Promise<PdfJs> | null = null;
const loadPdfJs = () => (pdfjsLoad ??= import("unpdf/pdfjs"));

/**
 * The PDF of a paper with the quote of the selected value framed (step 3a.3). The frames come from the worker (stored with
 * the field); this only draws them over the page. When the quote could not be placed it shows the page and says so.
 */
export function PdfViewer({
  paperId,
  page,
  printedPage,
  highlight,
  hasQuote,
  fieldKey,
  canDownload,
}: {
  paperId: string;
  /** Page of the selected value (1-based). The frame, when there is one, may sit on the next or previous page. */
  page: number;
  printedPage: string | null;
  highlight: Highlight | null;
  hasQuote: boolean;
  /** Changes when another value is selected, so the viewer returns to that value's page. */
  fieldKey: string | null;
  /** The visitor may save a copy of the PDF (lib/pdf-access decides). */
  canDownload: boolean;
}) {
  const target = highlight?.page ?? page;
  const [current, setCurrent] = useState(target);
  const [zoom, setZoom] = useState(1);
  const [showFrame, setShowFrame] = useState(true);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [typed, setTyped] = useState(String(target));
  const canvas = useRef<HTMLCanvasElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const firstBox = useRef<HTMLDivElement>(null);

  // Selecting another value goes to its page.
  useEffect(() => {
    setCurrent(target);
    setTyped(String(target));
  }, [target, fieldKey]);

  useEffect(() => {
    let cancelled = false;
    let loaded: Doc | null = null;
    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        const response = await fetch(`/api/papers/${paperId}/pdf`);
        if (!response.ok) throw new Error(`Không tải được PDF (${response.status})`);
        const data = new Uint8Array(await response.arrayBuffer());
        loaded = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return;
        setDoc(loaded);
        setPageCount(loaded.numPages);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Không mở được PDF");
      }
    })();
    return () => {
      cancelled = true;
      void (loaded as unknown as { destroy?: () => Promise<void> } | null)?.destroy?.();
    };
  }, [paperId]);

  useEffect(() => {
    if (!doc || !canvas.current || !scroller.current) return;
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<unknown> } | null = null;
    (async () => {
      try {
        const pdfPage = await doc.getPage(Math.min(Math.max(current, 1), doc.numPages));
        const natural = pdfPage.getViewport({ scale: 1 });
        const available = Math.max(scroller.current!.clientWidth - 24 - 17, 200);
        const viewport = pdfPage.getViewport({ scale: (available / natural.width) * zoom });
        const ratio = window.devicePixelRatio || 1;
        const el = canvas.current!;
        el.width = Math.floor(viewport.width * ratio);
        el.height = Math.floor(viewport.height * ratio);
        el.style.width = `${viewport.width}px`;
        el.style.height = `${viewport.height}px`;
        task = pdfPage.render({ canvas: el, viewport, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined });
        await task.promise;
        if (cancelled) return;
        const drawn =
          highlight && highlight.page === current
            ? highlight.rects.map((rect) => toCanvasBox(viewport.transform, rect, 2))
            : [];
        setBoxes(drawn);
      } catch (e) {
        // A render cancelled by a newer one is not an error.
        if (!cancelled && !(e instanceof Error && e.name === "RenderingCancelledException")) setError(e instanceof Error ? e.message : "Không vẽ được trang PDF");
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, current, zoom, highlight]);

  // Bring the first frame into view when it is drawn.
  useEffect(() => {
    if (boxes.length > 0 && showFrame) firstBox.current?.scrollIntoView?.({ block: "center", inline: "nearest" });
  }, [boxes, showFrame]);

  const go = (n: number) => {
    const clamped = Math.min(Math.max(Math.round(n) || 1, 1), pageCount || Infinity);
    setCurrent(clamped);
    setTyped(String(clamped));
  };

  const onThisPage = highlight !== null && highlight.page === current;
  const note = !hasQuote ? null : highlight === null ? NOT_LOCATED : highlight.page !== current ? `Câu trích nằm ở trang ${highlight.page} của file PDF.` : null;

  return (
    <div className="pdf-viewer" data-testid="pdf-viewer" data-page={current}>
      <div className="pdf-toolbar" data-testid="pdf-page">
        Đang mở trang {current} của file PDF{current === page && printedPage ? ` (trang in ${printedPage})` : ""}
      </div>
      <div className="pdf-controls" role="toolbar" aria-label="Điều khiển PDF">
        <button type="button" onClick={() => go(current - 1)} disabled={current <= 1} aria-label="Trang trước" data-testid="pdf-prev">
          ‹
        </button>
        <label className="pdf-page-input">
          <span className="sr-only">Số trang</span>
          <input
            type="number"
            min={1}
            max={pageCount || undefined}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go(Number(typed))}
            onBlur={() => go(Number(typed))}
            data-testid="pdf-page-input"
          />
        </label>
        <span className="muted">/ {pageCount || "?"}</span>
        <button type="button" onClick={() => go(current + 1)} disabled={pageCount > 0 && current >= pageCount} aria-label="Trang sau" data-testid="pdf-next">
          ›
        </button>
        <span className="pdf-sep" />
        <button type="button" onClick={() => setZoom((z) => stepZoom(z, -1))} disabled={zoom <= ZOOM_MIN} aria-label="Thu nhỏ" data-testid="pdf-zoom-out">
          −
        </button>
        <span className="muted" data-testid="pdf-zoom">
          {Math.round(zoom * 100)}%
        </span>
        <button type="button" onClick={() => setZoom((z) => stepZoom(z, 1))} disabled={zoom >= ZOOM_MAX} aria-label="Phóng to" data-testid="pdf-zoom-in">
          +
        </button>
        <label className="pdf-frame-toggle">
          <input type="checkbox" checked={showFrame} onChange={(e) => setShowFrame(e.target.checked)} data-testid="pdf-frame-toggle" /> Tô sáng
        </label>
        {canDownload && (
          <a className="pdf-native" href={`/api/papers/${paperId}/pdf?download=1`} download data-testid="pdf-download">
            Tải PDF
          </a>
        )}
        {canDownload ? (
          <a href={`/api/papers/${paperId}/pdf#page=${current}`} target="_blank" rel="noreferrer">
            Mở bằng trình xem của trình duyệt
          </a>
        ) : (
          <span className="pdf-native muted" data-testid="pdf-view-only">
            Chỉ để xem, đối chiếu: bài chưa có giấy phép mở nên không tải được
          </span>
        )}
      </div>
      {note && (
        <p className="pdf-note" data-testid="pdf-locate-note" role="status">
          {note}
        </p>
      )}
      {error ? (
        <p className="pdf-note" role="alert" data-testid="pdf-error">
          {error}.{canDownload ? " Bạn có thể thử «Mở bằng trình xem của trình duyệt»." : " Hãy tải lại trang; nếu vẫn lỗi, mở DOI của bài để đọc bản gốc."}
        </p>
      ) : (
        <div className="pdf-scroller" ref={scroller}>
          <div className="pdf-page">
            <canvas ref={canvas} data-testid="pdf-canvas" />
            {showFrame &&
              onThisPage &&
              boxes.map((b, i) => (
                <div key={i} ref={i === 0 ? firstBox : undefined} className="pdf-highlight" data-testid="pdf-highlight" style={{ left: b.left, top: b.top, width: b.width, height: b.height }} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
