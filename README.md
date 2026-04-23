# 🎨 Draw & Guess AI

A high-performance, responsive web application where you draw, and advanced AI models (Gemini & Mistral) guess what you've sketched in real-time.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Node](https://img.shields.io/badge/Node-22-green?logo=node.js)

## ✨ Key Features

- **Dual AI Providers:** Switch between **Google Gemini 2.0 Flash** and **Mistral Pixtral 12B** with a single click.
- **Smart Vector Drawing:** High-fidelity drawing board with native support for:
  - 🔄 **Undo/Redo:** Unlimited history for your strokes.
  - 🧽 **Eraser Tool:** High-precision erasing.
  - 📱 **Responsive Canvas:** Works perfectly on Desktop, Tablets, and Mobile.
- **Optimized for LAN:** Access the app on any device on your Wi-Fi (perfect for drawing with a stylus on a tablet).
- **High-DPI Support:** Crisp, full-resolution captures ensure the AI sees every detail.
- **Multi-Language Support:** Recognizes letters, numbers, and characters from any language (e.g., Chinese, Japanese, Arabic).

## 🚀 Tech Stack

- **Frontend:** React, Vanilla CSS, Webpack.
- **Backend:** Node.js, Express.
- **AI Models:** 
  - Google Gemini 2.0 Flash.
  - Mistral Pixtral 12B (Vision).
- **Libraries:** `react-signature-canvas`, `@google/generative-ai`, `@mistralai/mistralai`.

## 🛠️ Installation & Setup

### 1. Prerequisites
- Node.js (v20+)
- npm

### 2. Clone and Install
```bash
git clone <your-repo-url>
cd draw-guess

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### 3. Environment Variables
Create a `.env` file in the `draw-guess/backend` directory:
```env
GEMINI_API_KEY=your_google_ai_key
MISTRAL_API_KEY=your_mistral_ai_key
PORT=3001
```

### 4. Running the App
Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd draw-guess/backend
npm start
```

**Terminal 2 (Frontend):**
```bash
cd draw-guess/frontend
npm run serve
```

Access the app at: `http://localhost:8080` (or your LAN IP).

## 💡 Usage Tips
- **Be Decisive:** The AI is tuned for high determinism. It will try its best to give you a literal name for your drawing.
- **Switch Providers:** If you hit a daily limit on one model, switch to the other to keep drawing!
- **Context:** The AI handles objects, characters, and scenery with ease. Use the eraser to refine your sketch if the first guess is off.

---
Created with ⚡ by Gemini CLI
