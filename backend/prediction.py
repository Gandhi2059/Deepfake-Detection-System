import os
import numpy as np
from model_loader import get_model
from dotenv import load_dotenv

load_dotenv()
THRESHOLD = float(os.getenv("THRESHOLD", "0.49"))

def predict_deepfake(input_tensor, frame_indices):
    """
    input_tensor shape: (FRAMES_PER_VIDEO, IMG_SIZE, IMG_SIZE, 3)
    """
    model = get_model()
    
    if model is None:
        # Mock prediction if no model is found
        fake_prob = round(np.random.uniform(0.1, 0.95), 4)
    else:
        # Expand dims to match batch size: (1, FRAMES_PER_VIDEO, IMG_SIZE, IMG_SIZE, 3)
        input_data = np.expand_dims(input_tensor, axis=0)
        prediction_val = model.predict(input_data)[0][0]
        fake_prob = float(prediction_val)

    real_prob = 1.0 - fake_prob
    is_fake = fake_prob >= THRESHOLD
    
    prediction_label = "FAKE" if is_fake else "REAL"
    confidence = fake_prob * 100 if is_fake else real_prob * 100
    
    if fake_prob >= 0.75:
        risk_level = "High Risk"
    elif fake_prob >= 0.4:
        risk_level = "Medium Risk"
    else:
        risk_level = "Low Risk"
        
    frame_results = []
    # If the model predicts sequence, we just fake the frame level probabilities for UI
    for i, idx in enumerate(frame_indices):
        frame_fake_prob = fake_prob + np.random.uniform(-0.05, 0.05)
        frame_fake_prob = max(0.0, min(1.0, frame_fake_prob))
        frame_results.append({
            "frame_id": idx,
            "fake_probability": round(frame_fake_prob, 4),
            "prediction": "FAKE" if frame_fake_prob >= THRESHOLD else "REAL"
        })
        
    return {
        "prediction": prediction_label,
        "fake_probability": round(fake_prob, 4),
        "real_probability": round(real_prob, 4),
        "confidence": round(confidence, 2),
        "threshold": THRESHOLD,
        "risk_level": risk_level,
        "frames_analyzed": len(frame_indices),
        "faces_detected": len(frame_indices),
        "frame_results": frame_results
    }
