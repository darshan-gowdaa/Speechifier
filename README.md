<div align="center">
  <h1>
    <img src="public/favicon.ico" height="32" alt="Speechifier Logo" />
    Speechifier
  </h1>
  <h3>Offline Text to Speech Reader</h3>

  <p>
    A high-performance offline document reader that extracts text from PDFs and Word documents and converts it into natural-sounding speech right in the browser.
    <br />
    <br />
    <strong>
    Vercel Deployment:
    <a href="https://speech-to-text-next.vercel.app/"><strong>View Live Website »</strong></a>
    </strong>
  </p>
</div>

---

<div align="center">
Built with Next.js and the native Web Speech API
</div>

---

<div align="center">

![Next.js](https://img.shields.io/badge/next.js-%23000000.svg?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

</div>

<br />

# About The Project

Speechifier is a modern, privacy-focused text-to-speech application. It leverages the native Web Speech API to process documents locally, ensuring data never leaves the device. 

Unlike traditional cloud-based TTS services, Speechifier is designed for instant, offline usage. It handles complex document parsing directly in the browser and provides a highly customizable playback experience with adjustable speed, pitch, and voice selection.

## Key Objectives
- **100% Offline Processing**: No server uploads required; all document parsing and speech generation happen locally.
- **Privacy First**: Documents and text never leave the device.
- **High-Performance Parsing**: Uses Web Worker offloading for heavy document extraction tasks to keep the UI at 60fps.

---

# How It Works

Speechifier is structured around three main technical pillars: document extraction, text-to-speech synthesis, and synchronized visualization.

### Document Extraction (`useDocumentExtractor.ts`)
The extraction layer handles three file types directly in the browser:
- **PDFs**: Uses `pdf.js`. To prevent the main thread from blocking when parsing large PDFs, it dynamically loads `pdf.worker.min.mjs` as a Web Worker. It iterates through the document pages, filters the raw layout items to extract valid strings, and concats them into a clean blob.
- **DOCX**: Uses `mammoth.js` to read the raw ArrayBuffer and extract unformatted text while stripping away XML bloat.
- **TXT**: Uses the native `File.text()` API.

### Text-to-Speech Engine (`useTTS.ts`)
The core audio engine leverages the native `SpeechSynthesis` API but layers custom logic on top to handle common browser limitations (like the engine cutting off after 15 seconds of continuous reading).

- **Text Normalization**: Before synthesis, text is sanitized. URLs are stripped, abbreviations (like Dr., Mr.) are expanded to prevent stutters, smart quotes are normalized, and errant linebreaks are collapsed.
- **Language Detection**: A lightweight n-gram stopword heuristic inspects the first 1000 characters to detect the language (checking for frequency of 'the', 'la', 'der', etc.), ensuring the correct voice profile is selected.
- **Intelligent Chunking**: To prevent engine timeouts and improve cadence, the text is split into chunks of maximum 35 words. The splitting logic respects natural prosody boundaries by dividing at commas, periods, or conjunctions ("and", "but").
- **Synchronization**: The engine uses recursive chaining (`speakChunk`) to queue the next utterance just before the current one finishes. It listens to the `onboundary` event to track exactly which word is being spoken. It calculates the overall progress percentage by mapping the current character index against the current chunk length and total chunk count.
- **Background Persistence**: Browsers often throttle or kill background tabs. The engine prevents this in two ways: it requests a native `WakeLock` via the Screen Wake Lock API, and as a fallback for mobile Safari/Chrome, it plays a silent, base64-encoded audio track in a loop using the HTML5 `Audio` constructor to force the OS to keep the thread alive.

### Audio Visualization (`Visualizer.tsx`)
The visualization layer is a high-performance `<canvas>` implementation synchronized directly with the TTS engine.

- When the `currentWord` updates via the `onboundary` event, the React state changes. The visualizer intercepts this and spikes a `targetAmplitude` variable based on the current pitch setting.
- The amplitude then decays at a speed inversely proportional to the reading rate.
- Inside a `requestAnimationFrame` loop, the canvas draws five overlapping sine waves (strands). The waves use different phase offsets and speeds, layered with a math envelope to pinch the ends. The global amplitude scales both the wave height and the CSS `transform: scale()` of the current spoken word, creating an immersive, reacting UI.

---

# Tech Stack & Architecture

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Document Parsing**: `pdf.js`, `mammoth`
- **Audio Generation**: Web Speech API (`SpeechSynthesis`)
- **Typography**: `next/font` (Inter & Instrument Serif)

---

# Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Production Build

To create a production build:

```bash
npm run build
npm start
```
```
