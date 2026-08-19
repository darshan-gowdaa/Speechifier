<div align="center">
    <h1>
    <img src="public/favicon.ico" height="32" alt="Speechifier Logo" />
    Speechifier
  </h1>
  <h3>Offline Text to Speech Reader</h3>

  <p>
    A high-performance offline document reader that extracts text from PDFs and Word documents and converts it into natural-sounding speech right in your browser.
    <br />
    <br />
    <strong>
    <h2>Vercel Deployment:
    <a href="https://speech-to-text-next.vercel.app/"><strong>View Live Website »</strong></a>
  </p>
</div>

---

<div align="center">
Built with ❤️ using Next.js and the Web Speech API
</div>

---

<div align="center">

![Next.js](https://img.shields.io/badge/next.js-%23000000.svg?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

</div>

<br />

# ⚡ About The Project

**Speechifier** is a modern, privacy-focused text-to-speech application. It leverages WebAssembly and the native Web Speech API to process documents entirely locally, ensuring your data never leaves your device. 

Unlike traditional cloud-based TTS services, Speechifier is designed for instant, offline usage. It handles complex document parsing (PDF, DOCX) directly in the browser and provides a highly customizable playback experience with adjustable speed, pitch, and voice selection.

## 🎯 Key Objectives
- **100% Offline Processing**: No server uploads required; all document parsing and speech generation happen locally.
- **Privacy First**: Your documents and text never leave your device.
- **High-Performance Parsing**: Utilizing Web Worker offloading for heavy document extraction tasks to keep the UI at a buttery-smooth 60fps.

---

# ✨ Core Features

### 🖥️ Seamless Document Handling
- **Multi-Format Support**: Native support for PDF (`pdf.js`), DOCX (`mammoth`), and raw TXT files.
- **Instant Extraction**: Drag-and-drop your files and see the text instantly extracted and ready for playback.

### 🎨 Advanced UX/UI
- **Custom Audio Controls**: Fine-tune your listening experience with granular controls for speech rate (0.5x to 2x) and pitch.
- **Visual Feedback**: Real-time strand visualization synced with the audio playback state.
- **Responsive Design**: A sleek, minimal, and fully responsive layout built with Tailwind CSS, accessible across desktop and mobile.
- **Progress Tracking**: Visual progress slider to jump to different parts of the speech.

---

# 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS, Remix Icons
- **Document Parsing**: 
  - `pdf.js` for PDF extraction.
  - `mammoth` for DOCX parsing.
- **Audio Generation**: Web Speech API (`SpeechSynthesis`)
- **Typography**: `next/font` (Inter & Instrument Serif)

---

# 🚀 Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Production Build

To create a production build:

```bash
npm run build
npm start
```
