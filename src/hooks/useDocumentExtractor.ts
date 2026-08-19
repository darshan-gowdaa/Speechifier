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

      // text files
      if (ext === 'txt' || file.type === 'text/plain') {
        const text = await file.text();
        if (!text.trim()) throw new Error('This text file appears to be empty.');
        setStatus('done');
        return text.trim();
      }

      // word files
      if (ext === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (!result.value.trim()) throw new Error('No readable text found in this document.');
        setStatus('done');
        return result.value.trim();
      }

      // pdf files
      if (ext === 'pdf' || file.type === 'application/pdf') {
        const pdfjsLib = await import('pdfjs-dist');
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        }
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

        const pages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pageText = (content.items as any[])
            .filter((item) => typeof item.str === 'string')
            .map((item) => item.str)
            .join(' ')
            .trim();
          if (pageText) pages.push(pageText);
        }

        const fullText = pages.join('\n\n');
        if (!fullText.trim()) throw new Error('No text found in this PDF.');
        setStatus('done');
        return fullText;
      }

      throw new Error(`Unsupported file type ".${ext}".`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to extract text from file.';
      setError(msg);
      setStatus('error');
      throw new Error(msg);
    }
  }, []);

  return { status, error, extract };
}
