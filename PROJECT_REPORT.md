# 📊 Project Development Report: Draw & Guess AI

**Date:** April 26-27, 2026
**Development Time:** ~5 Hours (Total Session)
**Platform:** Web (Cross-platform Desktop/Mobile)
**Architecture:** npm Workspaces Monorepo

---

## 1. Executive Summary
The goal was to create an interactive web application where users can draw on a screen, and an AI provides real-time recognition of the sketch. The project evolved to support complex math solving, multi-language character recognition, and "Spatial Results"—where the AI actually "writes" its answer back onto the drawing canvas in a natural handwriting font.

---

## 2. Timeline & Development Phases

### Phase 1: Foundation (Hours 1-1.5)
*   **Initialization:** Set up a Node.js Express backend and a React frontend.
*   **Drawing Engine v1:** Implemented a basic drawing board using `react-sketch-canvas`.
*   **AI Integration:** Connected the Google Gemini 1.5 Flash API for multimodal image analysis.
*   **LAN Support:** Configured Webpack to allow access over local Wi-Fi via QR code.

### Phase 2: Stability & UX (Hours 1.5-3)
*   **Engine Swap:** Replaced the initial drawing library with `react-signature-canvas` and finally a **Custom Smoothing Engine** using `perfect-freehand` to provide a calligraphic "ink" feel.
*   **Feature Expansion:** Added **Undo**, **Redo**, and a high-precision **Eraser**.
*   **Precision Fix:** Solved a critical "delta offset" bug where pen strokes drifted from the fingertip on high-resolution (Retina) mobile screens.

### Phase 3: The "Spatial" Breakthrough (Hours 3-4)
*   **Contextual Awareness:** Upgraded the AI to detect math problems (e.g., `5+7=`) and calculate results.
*   **Spatial Mapping:** Implemented a grid-based coordinate system allowing the AI to return the exact `[X, Y]` location of the drawing.
*   **Handwriting Injection:** Integrated the "Caveat" Google Font to render AI results as natural handwriting directly on the canvas.

### Phase 4: Professional Refinement (Hour 5)
*   **Architecture:** Converted the project into an **npm Workspaces Monorepo**.
*   **DevOps:** Centralized port and API key management into a single root `.env` file.
*   **Security:** Performed a full security sweep, cleaned Git history, and established `.env.example` templates.
*   **Publishing:** Successfully pushed the clean, production-ready code to GitHub.

---

## 3. Key Hurdles & Solutions

### Hurdle 1: The "429 Quota" Trap
*   **Problem:** The free-tier Gemini 2.0 models had an extremely low limit (20 requests/day), which we exhausted during testing.
*   **Solution:** Switched to **Gemini 2.0 Flash-Lite** and implemented **manual/debounced guessing** to preserve the daily quota.

### Hurdle 2: OCR vs. Vision Models
*   **Problem:** Mistral OCR was returning markdown artifacts like `![img-0.jpeg]` when looking at sketches.
*   **Solution:** Replaced the document-based OCR model with **Pixtral 12B (Multimodal)** and used a "Strict OCR" prompt to force literal text responses.

### Hurdle 3: High-DPI Coordinate Hallucination
*   **Problem:** AI results were appearing in random locations because the AI was confused by the coordinate scale (0-1000).
*   **Solution:** Moved to a **Percentage-Based Grid (0-100%)** and updated the prompt to anchor results specifically to the right edge of the detected bounding box.

### Hurdle 4: Absolute Path Portability
*   **Problem:** Automated scripts worked on the host machine but failed the "everyone's computer" test due to hardcoded NVM paths.
*   **Solution:** Refactored the entire project to use standard, portable `npm` and `npx` commands within the `package.json`.

---

## 4. Final Technology Stack
*   **Frontend:** React 19, Vanilla CSS, Webpack 5.
*   **Backend:** Node.js 22 (ES Modules), Express.
*   **AI Providers:** Google Gemini 2.0 Flash-Lite, Mistral Pixtral 12B.
*   **Utilities:** 
    *   `perfect-freehand` (Stroke smoothing)
    *   `express-rate-limit` (Security)
    *   `concurrently` (Automation)
    *   `dotenv` (Config)

---

## 5. Conclusion
The project successfully met and exceeded all initial requirements. It is a robust, secure, and highly optimized application that demonstrates advanced AI implementation techniques such as spatial reasoning and multimodal grounding.

**Final Repo Status:** [https://github.com/deepanshu44/draw-guess](https://github.com/deepanshu44/draw-guess) (Live & Synced)
