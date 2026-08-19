import { useState, useCallback } from 'react';

export type ExtractStatus = 'idle' | 'extracting' | 'done' | 'error';

export function useDocumentExtractor() {
  const [status, setStatus] = useState<ExtractStatus>('idle');
  const [error, setError] = useState('');

  const extract = useCallback(async (file: File): Promise<string> => {
    setStatus('extracting');
    setError('');

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();

      // ── Plain text ─────────────────────────────────────────────────────
      if (ext === 'txt' || file.type === 'text/plain') {
        const text = await file.text();
        setStatus('done');
        return text.trim();
      }

      // ── DOCX ───────────────────────────────────────────────────────────
      if (
        ext === 'docx' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (!result.value.trim()) throw new Error('No text found in this document.');
        setStatus('done');
        return result.value.trim();
      }

      // ── PDF ────────────────────────────────────────────────────────────
      if (ext === 'pdf' || file.type === 'application/pdf') {
        const pdfjsLib = await import('pdfjs-dist');

        // Set worker source — use CDN matching the installed version
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const pages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((item: any) => item.str)
            .join(' ');
          if (pageText.trim()) pages.push(pageText.trim());
        }

        const fullText = pages.join('\n\n');
        if (!fullText.trim()) throw new Error('No text found in this PDF. It may be a scanned image.');
        setStatus('done');
        return fullText;
      }

      throw new Error(
        `Unsupported file type: .${ext}. Please upload a PDF, DOCX, or TXT file.`
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to extract text from file.';
      setError(msg);
      setStatus('error');
      throw new Error(msg);
    }
  }, []);

  return { status, error, extract };
}
