# Deepfake-Detection-System

This project is an AI-powered deepfake detection system that analyzes uploaded images and videos to identify manipulated media using machine learning and computer vision. It supports media upload, preprocessing, prediction, report generation, and an admin dashboard. Designed for research, education, and demonstration, it offers a practical way to explore deepfake detection technology.

## Project Ownership & Contact
This project belongs to Gandhi Raj Giri.

For any information regarding this project, please contact me through the project website or via email:
- Email: gandhigiri56@gmail.com
- Website: https://www.gandhiraj.com.np

For the research paper associated with this project, please contact me through my mail or website.

## Features
- **Frontend**: Next.js (App Router), Tailwind CSS, Framer Motion, Recharts
- **Backend**: FastAPI, TensorFlow/Keras, OpenCV, MediaPipe
- **Functionality**:
  - Upload videos or images for deepfake analysis
  - Extracts frames, detects faces, crops, normalizes
  - Provides a mock/actual prediction using a TensorFlow Keras model
  - Generates downloadable PDF reports
  - Admin dashboard for tracking previous uploads (SQLite)

## Setup Instructions

### 1. Backend (FastAPI + Deep Learning)

Open a terminal and navigate to the `backend` folder:
```bash
cd backend
```

Create a virtual environment (optional but recommended):
```bash
python -m venv venv
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Place your trained Keras model inside `backend/models/best_accuracy_gain_model.keras`
(If no model is found, the backend will return simulated mock values instead of crashing, for UI demonstration)

Start the backend server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend (Next.js)

Open another terminal and navigate to the `frontend` folder:
```bash
cd frontend
```

Install packages:
```bash
npm install
```

Start the frontend development server:
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Default Admin Credentials
- **Password**: `admindhruva`
