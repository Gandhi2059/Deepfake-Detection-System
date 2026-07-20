ac# Deepfake Detection System — Algorithm Details (All Algorithms)

This report documents the end-to-end inference algorithm implemented in the system.

---

## 4.2 Algorithm Details

### 4.2.1 Overview of the Pipeline
The system processes an input media file (video or image) using the following stages:

1. **Input handling & validation** (upload type/size)
2. **Frame sampling** (for videos)
3. **Face detection** (face localization)
4. **Face cropping with padding** (region extraction)
5. **Preprocessing** (resize + normalization)
6. **Deepfake classification** (Keras model inference)
7. **Decision thresholding & risk scoring**
8. **Per-frame results for UI**
9. **PDF report generation**

The backend orchestrates these steps in `backend/main.py`:
- upload → `extract_faces_from_video` / `extract_faces_from_image` → `predict_deepfake` → DB save → `generate_pdf_report`.

---

### 4.2.2 Input Handling (Upload Validation)
When a user uploads media via `POST /api/predict`:

- **Supported formats**
  - Videos: `mp4`, `mov`, `avi`, `mkv`
  - Images: `jpg`, `jpeg`, `png`
- **File size limit**
  - Controlled by environment variable `MAX_UPLOAD_SIZE` (default: `52428800` bytes).
- Uploaded data is written to a temporary location under `temp/`.

---

### 4.2.3 Video Frame Sampling
For videos, the backend samples a fixed number of frames `FRAMES_PER_VIDEO` (default `16`).

Implemented in `backend/preprocessing.py` in `extract_faces_from_video(video_path, num_frames, img_size)`:

- Total number of frames is read using OpenCV:
  - `total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))`
- Frame indices are chosen uniformly using `np.linspace`:
  - If `total_frames < num_frames`: indices cover the full range and may repeat.
  - Else: indices are spaced across the timeline.

**Output:**
- The algorithm iterates over the chosen frame indices until it has collected enough face crops.

---

### 4.2.4 Face Detection (Haar Cascade)
Face localization is performed with an OpenCV Haar Cascade:

- `face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')`

For each sampled frame (or the single image case):

- Convert frame to grayscale:
  - `gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)`
- Detect faces:
  - `faces_detected = face_cascade.detectMultiScale(gray, 1.1, 4)`

If **no face** is detected, the system raises:
- Video: `ValueError("No faces detected in the video.")`
- Image: `ValueError("No faces detected in the image.")`

If at least one face is detected:
- The system selects the **first** face (`faces_detected[0]`) for cropping.

---

### 4.2.5 Face Cropping with Padding
Once a face bounding box `(x, y, w, h)` is obtained:

- Compute padding based on the largest box dimension:
  - `padding = int(0.2 * max(w, h))`
- Expand the box while clamping to image bounds:
  - `x1 = max(0, x - padding)`
  - `y1 = max(0, y - padding)`
  - `x2 = min(iw, x + w + padding)`
  - `y2 = min(ih, y + h + padding)`

The crop is taken from **RGB** for consistency with the model input preparation:
- `frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)`

---

### 4.2.6 Resizing and Normalization
Each extracted face crop is processed as follows:

- Resize to model input size (default `img_size = 224`):
  - `face_resized = cv2.resize(face_img, (img_size, img_size))`
- Normalize pixel values to `[0,1]`:
  - `face_normalized = face_resized / 255.0`

**Result tensor formation:**
- For videos: collect up to `num_frames` faces.
- If fewer than `num_frames` faces are found, the algorithm pads by replicating the last extracted face.

**Final shape (as used by the model):**
- `faces_array` has shape:
  - `(FRAMES_PER_VIDEO, IMG_SIZE, IMG_SIZE, 3)`

---

### 4.2.7 Image Mode Preprocessing
For image inputs, `extract_faces_from_image(image_path, num_frames, img_size)`:

- Detect face once.
- Crop + resize + normalize once.
- Replicate the processed face crop `num_frames` times to form a pseudo-sequence.

**Output:**
- `faces_array`: `(FRAMES_PER_VIDEO, 224, 224, 3)`
- `frame_indices`: `[1]*num_frames` for UI reporting.

---

### 4.2.8 Deepfake Classification Model Inference
Implemented in `backend/prediction.py` in `predict_deepfake(input_tensor, frame_indices)`.

1. **Model loading**
   - `model = get_model()`
2. **If model is missing**
   - The backend returns **mock** probabilities:
     - `fake_prob = np.random.uniform(0.1, 0.95)`
3. **If model is available**
   - Expand tensor for batch dimension:
     - input: `(FRAMES_PER_VIDEO, 224, 224, 3)`
     - batch: `(1, FRAMES_PER_VIDEO, 224, 224, 3)`
   - Predict:
     - `prediction_val = model.predict(input_data)[0][0]`
   - Interpret as the **fake probability**.

Compute:
- `real_prob = 1.0 - fake_prob`

---

### 4.2.9 Decision Thresholding
A single global threshold decides the class label.

- `THRESHOLD = float(os.getenv("THRESHOLD", "0.49"))`
- `is_fake = fake_prob >= THRESHOLD`

**Label output:**
- `prediction_label = "FAKE" if is_fake else "REAL"`

---

### 4.2.10 Confidence Score
Confidence is derived from whichever class is predicted:

- If FAKE:
  - `confidence = fake_prob * 100`
- If REAL:
  - `confidence = real_prob * 100`

This value is returned in the API response and rendered in UI/PDF.

---

### 4.2.11 Risk Level Scoring
Risk level is bucketed by the predicted fake probability:

- **High Risk**: `fake_prob >= 0.75`
- **Medium Risk**: `0.4 <= fake_prob < 0.75`
- **Low Risk**: `fake_prob < 0.4`

---

### 4.2.12 Per-frame Results for UI
For frame-level visualization in the frontend, the backend creates a list of per-frame outcomes.

For each `(i, idx)` in `frame_indices`:
- Perturb the overall fake probability:
  - `frame_fake_prob = fake_prob + np.random.uniform(-0.05, 0.05)`
- Clamp to `[0,1]`.
- Convert to a per-frame label using the same `THRESHOLD`.

Returned per-frame entry:
- `frame_id`: original frame index / UI id
- `fake_probability`: rounded
- `prediction`: `FAKE` or `REAL`

---

### 4.2.13 Output Packaging & Persistence
After prediction:

- Backend stores a `PredictionRecord` in SQLite, including:
  - `prediction`, `fake_probability`, `real_probability`, `confidence`, `risk_level`, `frames_analyzed`, `processing_time`, `user_id`.
- It generates a PDF report using `generate_pdf_report(filename, result)` and returns a `report_url`.

---

## Notes on Implementation Fidelity
- Face detection in code uses **OpenCV Haar Cascade**.
- The frontend methodology text mentions MediaPipe/MTCNN conceptually, but the backend preprocessing specifically uses Haar detection in `backend/preprocessing.py`.

---

## Appendix: Key Parameters (Defaults)
- `FRAMES_PER_VIDEO`: `16`
- `IMG_SIZE`: `224`
- `THRESHOLD`: `0.49`
- `MAX_UPLOAD_SIZE`: `52428800` bytes

## 5.1.2 Dataset Description

### A. Dataset Sources
The dataset utilized in this project was constructed by combining subsets from two standard academic benchmark releases:
* **FaceForensics++ (FF++):** Sourced from the original benchmark release, this forensic dataset provides thousands of manipulated facial videos generated using four automated manipulation methods (Deepfakes, Face2Face, FaceSwap, and NeuralTextures) across multiple compression levels (Raw, C23/Light, and C40/Heavy).
* **Celeb-DF (Version 2):** Sourced from the improved Celeb-DF v2 release, which addresses the quality limitations of older datasets by providing high-quality celebrity deepfakes with refined facial boundaries and minimal visual blending artifacts.

### B. Dataset Selection Rationale
These specific datasets were selected to ensure the proposed model generalizes effectively across varying media qualities and manipulation techniques:
* The inclusion of the **FaceForensics++** release enables the network to learn compression-robust frequency-domain descriptors, preventing performance degradation when videos are compressed or shared across social media platforms.
* The addition of **Celeb-DF (Version 2)** samples ensures that the spatial stream is evaluated against hyper-realistic blending edges rather than relying on low-quality artifacts.

### C. Dataset Assembly and Preprocessing
To build the hybrid dataset, videos from both benchmark sources were curated, and duplicate identities were removed. Corrupted or unreadable videos were excluded prior to preprocessing to ensure data integrity. The remaining videos were processed by extracting $15$ frames per sequence, detecting facial bounding boxes with $20\%$ spatial padding, and resizing all crops to a unified dimension of $128 \times 128 \times 3$. The curated dataset was shuffled prior to partitioning.

### D. Dataset Partitioning
The assembled dataset was partitioned into training, validation, and testing subsets. The dataset partitions were generated using a fixed random seed to ensure reproducibility. To prevent information leakage and ensure an unbiased evaluation, identity overlap between the training and testing partitions was strictly avoided.

Stratified sampling was employed to preserve the exact class distribution across the training, validation, and testing subsets. The sample distributions across the three partitions are detailed in Table 5.1:

#### **Table 5.1: Dataset Split and Sample Distribution**
| Split | Real (Authentic) | Fake (Manipulated) | Total |
| :--- | :---: | :---: | :---: |
| **Training (80% of Train Set)** | 3,800 | 4,224 | 8,024 |
| **Validation (20% of Train Set)** | 950 | 1,056 | 2,006 |
| **Testing (Independent)** | 475 | 528 | 1,003 |
| **Total** | **5,225** | **5,808** | **11,033** |

### E. Class Balance
The curated dataset maintains a highly balanced class ratio of approximately $47.36\%$ Real to $52.64\%$ Fake across all subsets, preventing the model from developing a class bias. To account for any minor residual class imbalances, the computed class weights were supplied to the training procedure through the deep learning framework's class-weight mechanism during model fitting, ensuring proportional gradient scaling.

---

## 5.1.3 Implementation Details of Training Modules (model.ipynb)

The model training pipeline handles the heavy lifting of parsing datasets, extracting facial features, applying adversarial augmentations, and constructing the core Tri-Stream neural network architecture. Below are the core classes, procedures, and algorithms implemented in the training pipeline.


### 1. The `Config` Class (Configuration Management)
This module acts as the centralized environment manager, automatically parsing paths depending on whether the pipeline runs in Kaggle or a local environment.

```python
class Config:
    POSSIBLE_BASES = ['/kaggle/input', '../input', './datasets']
    BASE_DIR = '/kaggle/input' # Fallback
    
    for p in POSSIBLE_BASES:
        if os.path.exists(p):
            BASE_DIR = p
            break

    EXTRACT_DIR = '/kaggle/working/extracted_faces'
    REAL_EXTRACT_DIR = os.path.join(EXTRACT_DIR, 'REAL')
    FAKE_EXTRACT_DIR = os.path.join(EXTRACT_DIR, 'FAKE')
    
    FRAMES_PER_VIDEO = 15     
    IMG_SIZE = (128, 128)     
    BATCH_SIZE = 8
    EPOCHS = 40
    LEARNING_RATE = 2e-4
```

### 2. Auto-Discovery Procedure (`get_video_paths`)
This procedure recursively traverses filesystem glob patterns to securely locate raw media files and categorize them by checking standard `FaceForensics++` or `celeb_df` naming conventions.

```python
def get_video_paths():
    real_videos, fake_videos = [], []
    all_mp4s = glob.glob(os.path.join(Config.BASE_DIR, "**/*.mp4"), recursive=True)
    all_avis = glob.glob(os.path.join(Config.BASE_DIR, "**/*.avi"), recursive=True)
    all_videos = all_mp4s + all_avis
    
    real_identifiers = ["original", "Celeb-real", "YouTube-real"]
    fake_identifiers = ["DeepFakeDetection", "Deepfakes", "Face2Face", "FaceShifter", "FaceSwap", "NeuralTextures", "Celeb-synthesis"]
    
    for v_path in all_videos:
        path_parts = v_path.split(os.sep)
        if any(rid in path_parts for rid in real_identifiers):
            real_videos.append(v_path)
        elif any(fid in path_parts for fid in fake_identifiers):
            fake_videos.append(v_path)
            
    return list(set(real_videos)), list(set(fake_videos))
```

### 3. MTCNN Face Extraction (`extract_faces_from_video`)
For maximum precision during academic training, we implement Multi-task Cascaded Convolutional Networks (MTCNN) to harvest region-of-interest patches rather than simple Haar Cascades. It dynamically crops around a 20% margin of the bounding box.

```python
from mtcnn import MTCNN
detector = MTCNN()

def extract_faces_from_video(video_path, output_dir, file_id, num_frames=Config.FRAMES_PER_VIDEO):
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)
    
    for i, idx in enumerate(frame_indices):
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret: continue
            
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = detector.detect_faces(rgb_frame)
        if len(results) > 0:
            best_detection = max(results, key=lambda d: d['box'][2] * d['box'][3])
            x, y, w_box, h_box = best_detection['box']
            # Crop with 20% spatial padding
            margin = 0.2
            x1, y1 = max(0, int(x - w_box * margin)), max(0, int(y - h_box * margin))
            x2, y2 = min(w, int(x + w_box * (1 + margin))), min(h, int(y + h_box * (1 + margin)))
            face_crop = cv2.resize(frame[y1:y2, x1:x2], Config.IMG_SIZE)
            cv2.imwrite(os.path.join(video_out_dir, f"frame_{i:03d}.jpg"), face_crop)
```

### 4. Adversarial Data Generator (`SotaVideoGen` / `aggressive_aug`)
This class inherits `tf.keras.utils.Sequence`. To ensure generalization against unknown generative methods, the inner loop dynamically acts to explicitly degrade training data (simulating deepfake artifacts and compression mismatches).

```python
class SotaVideoGen(tf.keras.utils.Sequence):
    def aggressive_aug(self, frame):
        if np.random.rand() > 0.5: frame = cv2.flip(frame, 1) 
        
        # JPEG Compression (mimics social media degradation)
        if np.random.rand() > 0.6:
            quality = np.random.randint(40, 95)
            _, encimg = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
            frame = cv2.imdecode(encimg, 1)
            
        # Gaussian Blur 
        if np.random.rand() > 0.7:
            frame = cv2.GaussianBlur(frame, (5, 5), 0)
            
        # Additive Gaussian Noise
        if np.random.rand() > 0.8:
            noise = np.random.normal(0, 5, frame.shape).astype(np.uint8)
            frame = cv2.add(frame, noise)
            
        return frame
```

### 5. Tri-Stream Core Algorithm (`build_sota_spatiotemporal_model`)
This defines our bleeding-edge Spatiotemporal Model framework using Keras 3. It utilizes an algorithm routing sequential media through an implicit Tri-Stream extractor, explicitly enforcing gradient calculation on temporal edges, and deploying Multi-Head Attention mechanisms to fuse semantic image structure with structural texture.

```python
def build_sota_spatiotemporal_model():
    seq_input = Input(shape=(Config.FRAMES_PER_VIDEO, *Config.IMG_SIZE, 3))
    tri_model = build_tri_stream_extractor((*Config.IMG_SIZE, 3))
    frames = Config.FRAMES_PER_VIDEO
    
    # Flatten via shape
    seq_flat = keras.ops.reshape(seq_input, [-1, *Config.IMG_SIZE, 3])
    rgb_flat, hf_flat, fft_flat = tri_model(seq_flat)
    
    # Map back to Spatiotemporal bounds
    rgb_seq = keras.ops.reshape(rgb_flat, [-1, frames, 64])
    hf_seq = keras.ops.reshape(hf_flat, [-1, frames, 64])
    fft_seq = keras.ops.reshape(fft_flat, [-1, frames, 64])
    
    # Temporal flickering extraction (differentiating sequential frames)
    hf_temporal_diff = hf_seq[:, 1:, :] - hf_seq[:, :-1, :]
    zero_pad = keras.ops.zeros_like(hf_temporal_diff[:, :1, :])
    hf_gradients = keras.ops.concatenate([zero_pad, hf_temporal_diff], axis=1) 
    hf_dynamic_state = Concatenate(axis=-1)([hf_seq, hf_gradients])
    
    combined_frequencies = Concatenate(axis=-1)([hf_dynamic_state, fft_seq])
    
    # Multihead Attention 
    attention_out = MultiHeadAttention(num_heads=4, key_dim=64)(
        query=rgb_seq, 
        value=combined_frequencies, 
        key=combined_frequencies
    )
    
    fused_sequence = LayerNormalization()(rgb_seq + attention_out)
    
    # Output handling via Stateful RNN
    lstm_out = Bidirectional(LSTM(256, return_sequences=False, dropout=0.3))(fused_sequence)
    x = Dense(128, activation='relu')(lstm_out)
    x = LayerNormalization()(x)
    x = Dropout(0.4)(x)
    x = Dense(64, activation='relu')(x)
    outputs = Dense(1, activation='sigmoid', dtype='float32')(x)
    
    return Model(inputs=seq_input, outputs=outputs, name="SOTA_Deepfake_Master")
```

## 5.2. Testing

### 5.2.1 Test Cases for Unit Testing

Unit testing focuses on testing each module separately. Each test case is given a relevant title to clearly describe what is being tested.

| Test Case ID | Test Case Title | Module | Test Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| UT-01 | Valid User Registration Test | User Authentication | User enters valid username and password | New user account is created successfully | Pass |
| UT-02 | Empty Registration Field Test | User Authentication | User submits registration form with empty fields | System displays required field error | Pass |
| UT-03 | Valid Login Test | User Authentication | User enters correct username and password | User is logged into the system | Pass |
| UT-04 | Invalid Login Test | User Authentication | User enters wrong password | System displays invalid login message | Pass |
| UT-05 | Valid Media Upload Test | Media Upload | User uploads supported image or video file | File is uploaded successfully | Pass |
| UT-06 | Missing File Upload Test | Media Upload | User clicks upload without selecting file | System displays file required message | Pass |
| UT-07 | Unsupported File Format Test | File Validation | User uploads .pdf, .txt, or unsupported file | System rejects the file | Pass |
| UT-08 | File Size Limit Test | File Validation | User uploads file larger than allowed size | System displays file size error | Pass |
| UT-09 | Video Frame Extraction Test | Preprocessing | System processes valid video file | Required frames are extracted successfully | Pass |
| UT-10 | Face Detection Test | Preprocessing | System processes frame containing face | Face region is detected and cropped | Pass |
| UT-11 | Frame Resizing Test | Preprocessing | Extracted face frame is processed | Frame is resized to target IMG_SIZE (e.g. 128×128×3 or 224x224x3) | Pass |
| UT-12 | Pixel Normalization Test | Preprocessing | Face frame is converted into numerical array | Pixel values are normalized to [0,1] | Pass |
| UT-13 | Input Tensor Preparation Test | Preprocessing | 15 processed face frames are combined | Tensor shape becomes BATCH×128×128×3 | Pass |
| UT-14 | Model Loading Test | Model Prediction | Backend loads trained .keras model | Model loads successfully without error | Pass |
| UT-15 | Model Inference Test | Model Prediction | Valid tensor is passed to model | Model returns prediction probability | Pass |
| UT-16 | Fake Classification Test | Result Generation | Prediction probability is ≥ 0.49 | Media is classified as Fake | Pass |
| UT-17 | Real Classification Test | Result Generation | Prediction probability is < 0.49 | Media is classified as Real | Pass |
| UT-18 | Confidence Score Test | Result Generation | Model returns prediction probability | Confidence score is calculated correctly | Pass |
| UT-19 | Prediction Record Storage Test | Database | Prediction result is saved | Record is stored in database | Pass |
| UT-20 | PDF Report Generation Test | Report Generation | User requests report after prediction | PDF report is generated successfully | Pass |

**Unit Testing Summary**

The unit testing verifies each individual module of the system, including authentication, media upload, file validation, preprocessing, model prediction, result generation, database storage, and PDF report generation. These tests confirm that each component works correctly before integrating the complete system.

### 5.2.2 Test Cases for System Testing

System testing checks the complete working flow of the Deepfake Detection System. It verifies whether different modules work together properly as a full application.

| Test Case ID | Test Case Title | System Scenario | Test Data / Input | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ST-01 | Complete User Registration Workflow Test | New user creates account | Valid user details | User account is created successfully | Pass |
| ST-02 | Complete User Login Workflow Test | Registered user logs into system | Correct username and password | User dashboard opens | Pass |
| ST-03 | Invalid Login Workflow Test | User enters wrong login credentials | Wrong password | Login error message is displayed | Pass |
| ST-04 | Valid Image Detection Workflow Test | User uploads supported image | Face image file | System processes image and displays result | Pass |
| ST-05 | Valid Video Detection Workflow Test | User uploads supported video | Face video file | System processes video and displays result | Pass |
| ST-06 | Unsupported File Upload Workflow Test | User uploads unsupported file | .pdf or .txt file | File is rejected with error message | Pass |
| ST-07 | Oversized File Upload Workflow Test | User uploads file above size limit | Large media file | File size error is displayed | Pass |
| ST-08 | Real Media Prediction Workflow Test | User uploads real facial media | Real image/video | System displays Real with confidence score | Pass |
| ST-09 | Fake Media Prediction Workflow Test | User uploads fake facial media | Fake image/video | System displays Fake with confidence score | Pass |
| ST-10 | No Face Detection Workflow Test | User uploads media without clear face | Non-face image/video | System displays face detection error | Pass |
| ST-11 | Corrupted Media Handling Test | User uploads damaged media file | Corrupted image/video | System displays processing error | Pass |
| ST-12 | Prediction Record Saving Workflow Test | Prediction is completed | Valid prediction output | Prediction record is saved in database | Pass |
| ST-13 | Prediction History Display Test | User opens history page | Logged-in user account | Previous prediction records are displayed | Pass |
| ST-14 | PDF Report Request Workflow Test | User requests report after prediction | Prediction record | PDF report is generated | Pass |
| ST-15 | PDF Report Download Test | User clicks download option | Generated report link | PDF file is downloaded successfully | Pass |
| ST-16 | Admin Login Workflow Test | Admin logs into dashboard | Valid admin credentials | Admin dashboard opens | Pass |
| ST-17 | Admin User Management Test | Admin views registered users | Admin dashboard request | User list is displayed | Pass |
| ST-18 | Admin Prediction Record View Test | Admin views all prediction records | Prediction record list request | All prediction records are displayed | Pass |
| ST-19 | Admin Record Deletion Test | Admin deletes selected record | Selected prediction record | Record is deleted from database | Pass |
| ST-20 | End-to-End Deepfake Detection Test | Complete system execution | Login → Upload → Preprocess → Predict → Store → Report | Full workflow completes successfully | Pass |

**System Testing Summary**

System testing confirms that the complete Deepfake Detection System works as expected. It verifies the integration of user authentication, media upload, preprocessing, trained .keras model prediction, database storage, result display, PDF report generation, and admin management. The system testing confirms that the application can handle valid inputs, invalid inputs, prediction workflow, report generation, and administrative operations properly.
