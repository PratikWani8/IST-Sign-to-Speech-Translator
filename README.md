# SanketISL: AI-Powered Indian Sign Language Sign-to-Speech Translator

[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg)](https://tailwindcss.com/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-yellow.svg)](https://opensource.org/licenses/Apache-2.0)

> A production-grade, end-to-end assistive translation platform that enables deaf and hard-of-hearing signers across India to communicate seamlessly with hearing individuals using real-time Indian Sign Language (ISL) computer vision inference and natural speech synthesis.

---

## 1. Project Overview & Motivation

Communication barriers in critical public scenarios—such as hospitals, banks, government administrative centers, and schools—frequently isolate deaf and hard-of-hearing individuals. When certified ISL interpreters are unavailable, simple tasks like conveying medical symptoms, verifying a bank PIN, or completing a government form become stressful hurdles.

**SanketISL** bridges this gap:
1. Captures live hand gestures via standard browser webcams.
2. Performs real-time machine learning inference using a fine-tuned Vision Transformer (`ViT-Base-Patch16-224`) trained specifically on Indian Sign Language.
3. Automatically stabilizes and deduplicates held signs using temporal streak filtering.
4. Assembles recognized signs into an editable **Sentence Builder Ledger**.
5. Reads confirmed sentences aloud in natural Indian English or Hindi using the browser's native **SpeechSynthesis API**.
6. Offers a dedicated **Reverse Communication Mode** allowing hearing staff to speak or type responses with high-contrast text and verified ISL fingerspelling guides.

> **Integrity Guarantee:** This project uses real computer vision and machine learning inference. No simulated AI recognition, mock random outputs, or hardcoded predictions are present in the live pipeline.

---

## 2. Pretrained Model Evaluation Strategy

Prior to implementation, the four primary open-source ISL model checkpoints were comprehensively inspected and benchmarked:

| Candidate Repository | Architecture | Weights Availability | Inference Input | Status & Evaluation Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **`AI4Bharat/OpenHands`** | Pose GCN / Pose Transformer | Checkpoints referenced | 3D MediaPipe landmark sequences | **Archived / Unmaintained.** Requires complex temporal landmark pipelines and is no longer actively maintained. |
| **`ayush2635/sanket-isl-translator`** | Dual-Stream TimeSformer + T5 | Only raw `.pth` weights | Video clips + 195 MediaPipe features | **Code Missing on Hub.** Checkpoint `model_best.pth` exists, but the custom dual-stream multimodal Python architecture code is omitted from the Hugging Face repo. |
| **`cdsteameight/ISL-SignLanguageTranslation`** | Keras Sequential CNN/LSTM | `isl-translate-v1.keras` | Video clips | **Low Accuracy (44%).** Official model card reports only 44% test accuracy on Zenodo video data. |
| **`Hemg/Indian-sign-language-classification`** *(Selected)* | **Vision Transformer (`google/vit-base-patch16-224-in21k`)** | **Verified `model.safetensors` (343 MB)** | **224x224 RGB image frames** | **Selected & Verified.** 99.05% reported evaluation accuracy across 35 certified ISL classes (Digits 1–9, Letters A–Z). Fast CPU inference (~430ms) and GPU-ready. Fully self-contained. |

### Why `Hemg/Indian-sign-language-classification` was Selected:
- **Real Pretrained Checkpoint:** Fully loadable via Hugging Face `transformers` with pre-computed `model.safetensors` weights (343 MB), stored locally in `ai-service/models/isl_vit` for 100% offline autonomy.
- **ISL-Specific Dataset:** Fine-tuned on authentic Indian Sign Language fingerspelling gestures rather than American Sign Language (ASL) or British Sign Language (BSL).
- **Latency & Reliability:** Standard Vision Transformer processes frames in ~430ms on modern standard CPUs without requiring expensive cloud GPUs.
- **Calibrated Uncertainty:** Exposes 35 raw softmax logits, allowing the service to honestly flag low-confidence or ambiguous gestures rather than guessing.

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             REACT FRONTEND (Vite)                           │
│  - Webcam Feed (MediaDevices API)       - Sentence Construction Ledger      │
│  - Live Prediction Overlay              - Speech Synthesis Audio Controls   │
│  - Reverse Hearing Mode                 - Verified Vocabulary Browser       │
└───────────────────────┬─────────────────────────────▲───────────────────────┘
                        │ HTTP / JSON                 │ Audio
                        ▼                             ▼
┌─────────────────────────────────────────┐   ┌───────────────────────────────┐
│       EXPRESS BACKEND GATEWAY           │   │    BROWSER SPEECH SYNTHESIS   │
│  - JWT Authentication & BCrypt Hashing  │   │  - Indian English (en-IN)     │
│  - Translation History CRUD             │   │  - Hindi (hi-IN) / UK / US    │
│  - Rate Limiting & Helmet Security      │   │  - Rate / Pitch Modulation    │
└───────────────────┬─────────────────────┘   └───────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
┌─────────────────┐   ┌───────────────────────────────────────────────────────┐
│     MONGODB     │   │               FASTAPI AI MICROSERVICE                 │
│  - Users        │   │  - Vision Transformer (ViT-Base-16-224)               │
│  - Translations │   │  - 35 ISL Classes (Digits 1-9, Alphabets A-Z)         │
│  - Preferences  │   │  - Softmax Confidence & Ambiguity Detection           │
│                 │   │  - Temporal Streak Smoothing & Hold Deduplication     │
└─────────────────┘   └───────────────────────────────────────────────────────┘
```

---

## 4. Technology Stack

### Frontend
- **Framework:** React 19 with Vite 8
- **Styling:** Tailwind CSS 4 with custom design tokens (deep emerald, navy, warm neutral surfaces)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Routing:** React Router DOM 7
- **HTTP Client:** Axios with JWT request interceptors
- **Browser APIs:** MediaDevices API (video stream), SpeechSynthesis API (TTS), Web Speech Recognition (Reverse Mode)
- **Testing:** Vitest + React Testing Library + JSDOM

### Main Backend
- **Runtime:** Node.js 18+ (tested on Node v24)
- **Framework:** Express.js 4
- **Database:** MongoDB 7.0 / 8.0 with Mongoose ODM (includes in-memory fallback for offline testing)
- **Authentication:** JSON Web Tokens (JWT) & BCrypt password hashing
- **Security:** Helmet HTTP headers, CORS origin verification, Express Rate Limiter
- **Testing:** Native Node.js test runner (`node:test`, `node:assert`)

### AI Microservice
- **Runtime:** Python 3.11 / 3.13
- **Framework:** FastAPI with Uvicorn
- **Computer Vision:** PyTorch, Torchvision, Pillow (PIL), NumPy, OpenCV
- **Transformers:** Hugging Face `transformers` (`ViTForImageClassification`, `AutoImageProcessor`)
- **Testing:** Pytest + FastAPI TestClient

---

## 5. Verified ISL Vocabulary & Context Modes

The model recognizes **35 verified ISL classes**:
- **Digits (9 classes):** `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`
- **Alphabets (26 classes):** `A` through `Z`

### Contextual Scenario Mapping:
- **Hospital & Healthcare:** Blood groups (`A`, `B`, `O`, `AB`), ward numbers (`Ward 3`), ICU letters, spelling medication and symptom names.
- **Banking & Financial Services:** PIN digits, OTPs, counter numbers (`Counter B`), KYC codes, loan types.
- **Government Administrative Offices:** Token numbers, queue letters, Aadhaar/PAN characters.
- **Education & Classrooms:** Spelling academic terms, counting, multiple-choice options (`A`, `B`, `C`, `D`), semester numbers.
- **Everyday Communication:** Spelling names, addresses, emergency acronyms (`HELP`, `SOS`).

---

## 6. Project Structure

```
isl-sign-to-speech/
├── ai-service/                      # Python FastAPI ML Microservice
│   ├── app/
│   │   ├── config.py                # Service settings & environment
│   │   ├── main.py                  # FastAPI routes & lifecycle
│   │   ├── model_loader.py          # Singleton ViT loader
│   │   ├── predictor.py             # Inference & temporal streak logic
│   │   ├── preprocessing.py         # Base64 decode & image validation
│   │   ├── schemas.py               # Pydantic data models
│   │   └── vocabulary.py            # 35 ISL signs & category definitions
│   ├── models/
│   │   └── isl_vit/                 # Offline Vision Transformer weights
│   │       ├── config.json
│   │       ├── model.safetensors    # 343 MB PyTorch weights
│   │       └── preprocessor_config.json
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_api.py              # Pytest test suite
│   ├── test_runner.py               # Standalone verification runner
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── backend/                         # Node.js Express Gateway
│   ├── src/
│   │   ├── config/ (db.js, env.js)
│   │   ├── controllers/ (auth, translation, vocabulary, ai)
│   │   ├── middleware/ (auth, errorHandler, rateLimiter)
│   │   ├── models/ (User.js, Translation.js)
│   │   ├── routes/ (auth, translation, vocabulary, ai, health)
│   │   ├── services/ (aiService.js)
│   │   ├── utils/ (jwt.js)
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   │   └── api.test.js              # Node.js test suite
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                        # React Vite Tailwind Client
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── CameraView.jsx       # Live webcam feed & targeting
│   │   │   ├── TranslationPanel.jsx # Active prediction & hold streak
│   │   │   ├── SentenceBuilder.jsx  # Sentence ledger with undo & speech
│   │   │   ├── SpeechControls.jsx   # Synthesizer voice/speed controls
│   │   │   ├── ConfidenceIndicator.jsx # Softmax calibration bars
│   │   │   ├── SignDemonstration.jsx   # ISL hand posture guide
│   │   │   ├── Navbar.jsx & Footer.jsx
│   │   │   └── LoadingState.jsx & ErrorState.jsx
│   │   ├── context/ (AuthContext.jsx)
│   │   ├── hooks/ (useCamera.js, useSpeechSynthesis.js, useSpeechRecognition.js)
│   │   ├── pages/ (Home, Translator, ReverseCommunication, Vocabulary, History, Login, Register, Settings)
│   │   ├── services/ (api.js)
│   │   ├── App.jsx & main.jsx
│   │   └── index.css                # Tailwind CSS v4 setup
│   ├── package.json
│   ├── Dockerfile
│   └── vite.config.js
│
├── docker-compose.yml               # Multi-container production deployment
├── start-all.ps1                    # Windows service launcher script
├── start-all.sh                     # Linux/macOS launcher script
├── package.json                     # Monorepo scripts
└── README.md
```

---

## 7. Installation & Quick Start

### Prerequisites
- **Node.js** 18+ and **npm** 9+
- **Python** 3.10, 3.11, or 3.13
- **MongoDB** (Local instance or MongoDB Atlas URI)
- A working **Webcam** and **Microphone**

---

### Method A: One-Click Startup (Recommended)

#### On Windows:
```powershell
.\start-all.ps1
```
This opens 3 separate terminal sessions running the AI microservice (`:8000`), Express backend (`:5000`), and Vite frontend (`:5173`).

#### On Linux / macOS:
```bash
chmod +x start-all.sh
./start-all.sh
```

---

### Method B: Manual Step-by-Step Startup

#### Step 1: Start MongoDB
Ensure MongoDB is running locally on port 27017:
```bash
# Using installed MongoDB:
mongod --dbpath <path_to_data_directory>
```
*(Note: If MongoDB is offline, the backend automatically operates with an in-memory storage fallback for demo and test evaluation).*

#### Step 2: Start the FastAPI AI Microservice
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Verify readiness at `http://127.0.0.1:8000/health`.

#### Step 3: Start the Express Backend
```bash
cd backend
npm install
npm run dev
```
Verify health at `http://127.0.0.1:5000/api/health`.

#### Step 4: Start the React Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

### Method C: Docker Compose

To launch all three services plus a MongoDB container with a single command:
```bash
docker-compose up --build
```
Access the application at `http://localhost:5173`.

---

## 8. Verification & Automated Test Suites

All three layers of the application include automated test suites:

### 1. AI Microservice Tests
```bash
# Run pytest suite:
cd ai-service && python -m pytest tests/ -v

# Or run the standalone verification runner:
python test_runner.py
```
*Tests verify model weight loading, image preprocessing, base64 decoding, confidence thresholding, ambiguity detection, and temporal sequence deduplication.*

### 2. Backend Gateway Tests
```bash
cd backend
npm test
```
*Tests verify user registration, duplicate prevention, password hashing, JWT authentication, protected profile retrieval, translation history CRUD, and category queries.*

### 3. Frontend Component Tests
```bash
cd frontend
npm test
```
*Tests verify component rendering, sentence builder editing, space/backspace manipulation, and speech synthesis triggers via Vitest.*

---

## 9. API Reference

### AI Microservice (`http://localhost:8000`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Microservice status, model readiness, inference device |
| `GET` | `/model-info` | Architecture, version, limitations, attribution |
| `GET` | `/vocabulary` | 35 verified ISL signs with descriptions and categories |
| `POST` | `/predict` | Predicts sign from base64 frame with softmax confidence |
| `POST` | `/predict/sequence` | Processes ordered frame sequences with temporal smoothing |
| `POST` | `/predict/upload` | Multipart file upload endpoint for testing |

### Express Backend (`http://localhost:5000/api`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | No | System health check (Database + AI service) |
| `POST` | `/auth/register` | No | User registration with JWT generation |
| `POST` | `/auth/login` | No | User authentication |
| `GET` | `/auth/me` | Bearer | Get authenticated user profile |
| `PUT` | `/auth/me` | Bearer | Update speech preference and history toggle |
| `POST` | `/translations` | Bearer | Save confirmed translation to ledger |
| `GET` | `/translations` | Bearer | Search and filter saved translation history |
| `DELETE` | `/translations/:id`| Bearer | Delete specific translation record |
| `DELETE` | `/translations` | Bearer | Clear all translation history for user |
| `GET` | `/vocabulary` | No | Get verified vocabulary |
| `GET` | `/vocabulary/categories`| No | Get supported domain categories |
| `POST` | `/ai/predict` | No | Forward webcam frame to AI microservice |
| `POST` | `/ai/predict/sequence`| No | Forward frame sequence to AI microservice |

---

## 10. Operational Guidelines & Ethical AI Disclosures

- **Camera Framing:** Align hand inside the designated dashed overlay guide. Keep the hand well-lit and avoid harsh backlighting.
- **Fingerspelling & Continuous Speech:** Indian Sign Language incorporates rich spatial grammar and facial expressions. This version provides real-time fingerspelling recognition (alphabets and digits) to construct spoken sentences.
- **Honest Confidence Scoring:** If a gesture is poorly lit, occluded, or ambiguous between similar hand shapes (such as `C` and `O`), the system marks the prediction as **Uncertain** with an actionable suggestion instead of fabricating a guess.
- **Privacy Assurance:** Webcam frames are processed in-memory solely for character classification. Raw video feeds are never recorded or stored on disk.

---

## 11. Attribution & Licenses

- **Model Checkpoint:** [`Hemg/Indian-sign-language-classification`](https://huggingface.co/Hemg/Indian-sign-language-classification) (Apache 2.0 License).
- **Base Architecture:** Google Vision Transformer (`google/vit-base-patch16-224-in21k`).
- **Research References:** AI4Bharat INCLUDE Dataset for Indian Sign Language Recognition.
