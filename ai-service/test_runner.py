import sys
import os
import base64
import io

def log(msg):
    sys.stderr.write(f"[TEST LOG] {msg}\n")
    sys.stderr.flush()

log("1. Setting env...")
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["MPLCONFIGDIR"] = os.path.expanduser("~/AppData/Local/Temp")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

log("2. Importing app modules...")
from app.config import settings
from app.vocabulary import get_all_vocabulary, CATEGORIES
from app.model_loader import model_manager
from app.preprocessing import decode_base64_image, validate_image_dimensions
from app.predictor import predict_single_image, predict_sequence_frames
from app.main import health_check, model_info, get_vocabulary, predict_frame, predict_sequence
from app.schemas import PredictRequest, SequencePredictRequest
from PIL import Image

log("3. Testing Vocabulary...")
vocab = get_all_vocabulary()
log(f"Total vocabulary items: {len(vocab)}")
assert len(vocab) == 35

log("4. Loading Model Checkpoint...")
loaded = model_manager.load_model()
log(f"Model loaded: {loaded}, Device: {model_manager.device}, Classes: {len(model_manager.label_map)}")

log("5. Testing Health check...")
health = health_check()
log(f"Health check status: {health.status}, model_loaded: {health.model_loaded}")

log("6. Testing Model info...")
info = model_info()
log(f"Model info: {info.model_name}, architecture: {info.architecture}")

log("7. Testing Predict Single Image...")
dummy_img = Image.new("RGB", (224, 224), color=(180, 180, 180))
buf = io.BytesIO()
dummy_img.save(buf, format="JPEG")
b64 = f"data:image/jpeg;base64,{base64.b64encode(buf.getvalue()).decode('utf-8')}"

req = PredictRequest(image_base64=b64, category="healthcare")
log("Calling predict_frame()...")
pred_res = predict_frame(req)
log(f"Prediction result: sign={pred_res.predicted_sign}, conf={pred_res.confidence}, status={pred_res.status}, latency={pred_res.processing_time_ms}ms")

log("8. Testing Sequence Prediction...")
seq_req = SequencePredictRequest(frames_base64=[b64, b64], min_stability_count=1)
seq_res = predict_sequence(seq_req)
log(f"Sequence result: decoded={seq_res.decoded_text}, processed_frames={seq_res.total_frames_processed}")

log("=========================================")
log("SUCCESS! All AI service integration tests passed!")
log("=========================================")
