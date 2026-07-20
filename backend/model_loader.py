import os
try:
    import tensorflow as tf
except ImportError:
    tf = None
from dotenv import load_dotenv

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "models/best_accuracy_gain_model.keras")

global_model = None

def load_deepfake_model():
    global global_model
    if global_model is None:
        try:
            if tf is not None and os.path.exists(MODEL_PATH):
                global_model = tf.keras.models.load_model(MODEL_PATH)
                print("Model loaded successfully.")
            else:
                print(f"Warning: Model not found at {MODEL_PATH} or Tensorflow is missing. Prediction will return mock values.")
        except Exception as e:
            print(f"Failed to load model: {e}")
    return global_model

def get_model():
    return global_model
