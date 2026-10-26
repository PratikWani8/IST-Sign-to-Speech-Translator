import io
import base64
import pytest
from PIL import Image

from app.main import app, health_check, model_info, get_vocabulary, predict_frame, predict_sequence
from app.model_loader import model_manager
from app.preprocessing import decode_base64_image, validate_image_dimensions
from app.schemas import PredictRequest, SequencePredictRequest

# Initialize model
model_manager.load_model()

def create_dummy_base64_image(color=(128, 128, 128), size=(224, 224)):
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

def test_health_endpoint():
    res = health_check()
    assert res.status == "healthy"
    assert res.model_loaded is True
    assert res.device == "cpu"

def test_model_info_endpoint():
    res = model_info()
    assert res.model_name == "Hemg/Indian-sign-language-classification"
    assert res.supported_vocabulary_count == 35
    assert res.is_ready is True
    assert len(res.known_limitations) > 0

def test_vocabulary_endpoint():
    res = get_vocabulary()
    assert res.total_signs == 35
    assert "digit" in res.supported_types
    assert "letter" in res.supported_types
    assert len(res.vocabulary) == 35
    sign_ids = [s.id for s in res.vocabulary]
    assert "A" in sign_ids
    assert "1" in sign_ids
    assert "Z" in sign_ids

def test_preprocessing_decode():
    b64 = create_dummy_base64_image()
    img = decode_base64_image(b64)
    assert isinstance(img, Image.Image)
    assert img.size == (224, 224)

def test_preprocessing_invalid_base64():
    with pytest.raises(ValueError):
        decode_base64_image("not-a-valid-base64!@#$")

def test_preprocessing_dimension_validation():
    small_img = Image.new("RGB", (32, 32))
    with pytest.raises(ValueError):
        validate_image_dimensions(small_img, min_width=64, min_height=64)

def test_predict_endpoint_valid_image():
    b64 = create_dummy_base64_image()
    req = PredictRequest(image_base64=b64, category="healthcare")
    res = predict_frame(req)
    assert res.status in ["success", "uncertain"]
    assert res.predicted_sign is not None
    assert 0.0 <= res.confidence <= 1.0
    assert len(res.alternatives) > 0
    assert res.processing_time_ms > 0

def test_predict_sequence_endpoint():
    b64_1 = create_dummy_base64_image(color=(100, 100, 100))
    b64_2 = create_dummy_base64_image(color=(120, 120, 120))
    req = SequencePredictRequest(
        frames_base64=[b64_1, b64_2],
        fps=10.0,
        min_stability_count=1
    )
    res = predict_sequence(req)
    assert res.status == "success"
    assert isinstance(res.decoded_signs, list)
    assert res.total_frames_processed == 2
