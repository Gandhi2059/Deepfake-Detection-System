import cv2
import numpy as np
import os
from tempfile import NamedTemporaryFile

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def extract_faces_from_video(video_path, num_frames=16, img_size=224):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Could not open video file.")
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    video_frames = []
    
    if total_frames < num_frames:
        frame_indices = np.linspace(0, max(0, total_frames - 1), total_frames, dtype=int)
    else:
        frame_indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)
        
    faces = []
    frame_results = []
    
    for idx_count, frame_idx in enumerate(frame_indices):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret:
            continue
            
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces_detected = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        ih, iw, _ = frame.shape
        if len(faces_detected) > 0:
            # take the first face
            x, y, w, h = faces_detected[0]
        else:
            # Fallback to center crop if no face detected
            x = int(iw * 0.25)
            y = int(ih * 0.25)
            w = int(iw * 0.5)
            h = int(ih * 0.5)
            
        # Add padding
        padding = int(0.2 * max(w, h))
        x1 = max(0, x - padding)
        y1 = max(0, y - padding)
        x2 = min(iw, x + w + padding)
        y2 = min(ih, y + h + padding)
        
        face_img = frame_rgb[y1:y2, x1:x2]
        if face_img.size == 0:
            continue
            
        face_resized = cv2.resize(face_img, (img_size, img_size))
        face_normalized = face_resized / 255.0
        faces.append(face_normalized)
        frame_results.append(idx_count)
        
        if len(faces) >= num_frames:
            break

    cap.release()
    
    if not faces:
        raise ValueError("No frames could be extracted from the video.")
        
    # Pad if necessary
    while len(faces) < num_frames:
        faces.append(faces[-1])  # replicate last found face
        
    faces_array = np.array(faces[:num_frames]) # Shape: (FRAMES_PER_VIDEO, IMG_SIZE, IMG_SIZE, 3)
    return faces_array, frame_results

def extract_faces_from_image(image_path, num_frames=16, img_size=224):
    frame = cv2.imread(image_path)
    if frame is None:
        raise ValueError("Could not open image file.")
        
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces_detected = face_cascade.detectMultiScale(gray, 1.1, 4)
    
    ih, iw, _ = frame.shape
    if len(faces_detected) == 0:
        # Fallback to center crop if no face detected
        x = int(iw * 0.25)
        y = int(ih * 0.25)
        w = int(iw * 0.5)
        h = int(ih * 0.5)
    else:
        x, y, w, h = faces_detected[0]
    
    # Add padding
    padding = int(0.2 * max(w, h))
    x1 = max(0, x - padding)
    y1 = max(0, y - padding)
    x2 = min(iw, x + w + padding)
    y2 = min(ih, y + h + padding)
    
    face_img = frame_rgb[y1:y2, x1:x2]
    # Edge case handler for invalid boundary crop
    if face_img.size == 0:
        face_img = frame_rgb
        
    face_resized = cv2.resize(face_img, (img_size, img_size))
    face_normalized = face_resized / 255.0
    
    faces_array = np.array([face_normalized] * num_frames)
    return faces_array, [1]*num_frames

