<div align="center">
  <h1>
    Speechifier
  </h1>
  <h3>Offline Text to Speech Reader</h3>

  <p>
    High-performance offline document reader. Extracts text from PDFs and Word docs, converts to natural speech, right in browser.
    <br />
    <br />
    <strong>
    <a href="https://speechifier-app.vercel.app/"><strong>View Live Demo »</strong></a>
    </strong>
  </p>
</div>

<div align="center">
Built with Next.js and native Web Speech API <br /> <br />
</div>

<div align="center">

![Next.js](https://img.shields.io/badge/next.js-%23000000.svg?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)

</div>

---

<br />

<div align="center">
  <img width="800" alt="Speechifier app screenshot" src="https://github.com/user-attachments/assets/99e47dfa-13a5-4a25-90ca-34440d9997b4" />
  <br />
  <br />
  <img width="500" alt="Speechifier demo" src="https://github.com/user-attachments/assets/1a664258-563b-416e-ae0b-5a386d2bae0e" />
</div>

<br />

## Table of Contents
- [About](#about-the-project)
- [Features](#key-features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack--architecture)
- [Getting Started](#getting-started)
---

# About The Project

Speechifier is a modern, privacy-first text-to-speech web application engineered for seamless document listening directly in your browser. By utilizing the native Web Speech API alongside Web Workers, Speechifier parses PDF, DOCX, and raw text files entirely on your local device—ensuring your sensitive documents never get uploaded to any external server. 

Unlike traditional cloud-dependent text-to-speech services, Speechifier is built for instant offline usage with zero latency. It features automatic language detection, intelligent prosody-aware text chunking to prevent browser speech synthesis timeouts, custom playback controls (pitch, rate, and voice selection), background thread persistence, and an interactive real-time canvas audio visualizer.

## Key Features
- **100% Offline Processing** — no server uploads, all parsing local
- **Privacy First** — docs and text never leave device
- **Interactive Reader View** — distraction-free markdown/text rendering
- **PDF Canvas Viewer** — renders actual PDF pages with exact bounding-box highlighting
- **Click-to-Seek** — click any word in the document to instantly jump TTS playback to that position
- **Auto-Scrolling** — document auto-scrolls to keep the active word perfectly centered
- **High-Performance Parsing** — Web Worker offloading keeps UI at 60fps
- **Multi-Format Support** — PDF, DOCX, TXT
- **Full Playback Control** — speed, pitch, voice selection
- **Auto Language Detection** — picks right voice profile automatically
- **Background Playback** — keeps reading even when tab backgrounded

---

# How It Works

Three pillars: document extraction, text-to-speech synthesis, synchronized visualization.

### Document Extraction (`useDocumentExtractor.ts`)
Handles three file types, all in-browser:
- **PDFs** — uses [pdf.js](https://mozilla.github.io/pdf.js/). Loads `pdf.worker.min.mjs` as Web Worker to keep main thread free on large files. Iterates pages, filters layout items for valid strings, concats into clean blob.
- **DOCX** — uses [mammoth.js](https://github.com/mwilliamson/mammoth.js) to read raw ArrayBuffer, extract unformatted text, strip XML bloat.
- **TXT** — uses native `File.text()` API.

### Text-to-Speech Engine (`useTTS.ts`)
Core engine leverages native `SpeechSynthesis` API, layers custom logic to fix browser quirks (like engine cutting off after 15s continuous reading).

- **Text Normalization** — strips URLs, expands abbreviations (Dr., Mr.) to prevent stutters, normalizes smart quotes, collapses errant linebreaks
- **Language Detection** — lightweight n-gram stopword heuristic scans first 1000 chars (checks frequency of "the", "la", "der", etc.) to pick correct voice profile
- **Intelligent Chunking** — splits text into max-35-word chunks. Respects natural prosody: splits at commas, periods, conjunctions ("and", "but")
- **Synchronization** — recursive chaining (`speakChunk`) queues next utterance just before current finishes. Listens to `onboundary` event to track exact word being spoken. Maps char index against chunk length + total chunk count for progress %
- **Background Persistence** — browsers throttle/kill background tabs. Fixed two ways: requests native `WakeLock` via Screen Wake Lock API, plus fallback silent base64 audio loop via HTML5 `Audio` constructor to keep OS thread alive on mobile Safari/Chrome

### Audio Visualization (`Visualizer.tsx`)
High-performance `<canvas>` synced directly to TTS engine.

- `currentWord` updates via `onboundary` → React state changes → visualizer spikes `targetAmplitude` based on pitch setting
- Amplitude decays at speed inversely proportional to reading rate
- Inside `requestAnimationFrame` loop, canvas draws five overlapping sine waves ("strands") — different phase offsets/speeds, math envelope pinches ends. Global amplitude scales wave height + CSS `transform: scale()` of spoken word → immersive reacting UI

---

# Tech Stack & Architecture

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Document Parsing | `pdf.js`, `mammoth` |
| Audio Generation | Web Speech API (`SpeechSynthesis`) |
| Typography | `next/font` (Inter & Instrument Serif) |

---

# Getting Started

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in browser.


