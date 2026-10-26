import time
import io
import logging
from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

from .config import settings
from .schemas import (
    HealthResponse,
    ModelInfoResponse,
    VocabularyResponse,
    PredictRequest,
    PredictResponse,
    SequencePredictRequest,
    SequencePredictResponse,
    SignItem
)
from .model_loader import model_manager
from .preprocessing import decode_base64_image, validate_image_dimensions
from .predictor import predict_single_image, predict_sequence_frames
from .vocabulary import get_all_vocabulary, CATEGORIES, ISL_VOCABULARY

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Production-grade AI Microservice for Indian Sign Language (ISL) recognition and translation."
)

@app.on_event("startup")
def startup_event():
    # Startup: Load the model checkpoint once
    logger.info("Initializing AI Microservice and loading ISL checkpoint...")
    loaded = model_manager.load_model()
    if loaded:
        logger.info("Pretrained Indian Sign Language model is ready for inference.")
    else:
        logger.warning(f"Model failed to load at startup: {model_manager.error_message}")

@app.on_event("shutdown")
def shutdown_event():
    logger.info("AI Microservice shutting down...")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
def health_check():
    """
    Health check endpoint reporting microservice status, model readiness, and inference hardware.
    Never reports ready until actual model weights have loaded successfully.
    """
    return HealthResponse(
        status="healthy" if model_manager.is_loaded else "degraded",
        model_loaded=model_manager.is_loaded,
        device=str(model_manager.device),
        version=settings.APP_VERSION,
        timestamp=time.time()
    )

@app.get("/model-info", response_model=ModelInfoResponse)
def model_info():
    """
    Returns architecture, supported vocabulary, device, and real model parameters.
    """
    return ModelInfoResponse(
        model_name=settings.MODEL_NAME,
        model_version="1.0.0",
        architecture="Vision Transformer (ViT-Base-Patch16-224 fine-tuned on ISL)",
        supported_input_format="RGB Image (224x224 or rescaled) or Base64 frame sequence",
        supported_vocabulary_count=len(ISL_VOCABULARY),
        inference_device=str(model_manager.device),
        is_ready=model_manager.is_loaded,
        confidence_threshold=settings.CONFIDENCE_THRESHOLD,
        known_limitations=[
            "Optimized for isolated static hand signs and fingerspelling (alphabets A-Z and digits 1-9)",
            "Signing requires well-lit camera conditions with hands centered in the bounding view",
            "Complex dynamic continuous sentences require fingerspelling and multi-frame temporal confirmation",
            "Not suitable in total darkness or heavy motion blur"
        ],
        attribution={
            "source": "Hemg/Indian-sign-language-classification on Hugging Face Hub",
            "base_model": "google/vit-base-patch16-224-in21k",
            "license": "Apache 2.0"
        }
    )

@app.get("/vocabulary", response_model=VocabularyResponse)
def get_vocabulary():
    """
    Returns the verified list of supported ISL signs and their contextual categories.
    """
    vocab_items = [
        SignItem(
            id=item["id"],
            name=item["name"],
            type=item["type"],
            description=item["description"],
            categories=item["categories"],
            example_usage=item["example_usage"],
            visual_guide_url=None
        )
        for item in get_all_vocabulary()
    ]
    return VocabularyResponse(
        total_signs=len(vocab_items),
        supported_types=["digit", "letter"],
        categories=[c["id"] for c in CATEGORIES],
        vocabulary=vocab_items
    )

@app.post("/predict", response_model=PredictResponse)
def predict_frame(request: PredictRequest):
    """
    Processes a webcam frame, runs real ViT model inference, and returns recognized sign with confidences.
    """
    if not model_manager.is_loaded:
        raise HTTPException(
            status_code=503,
            detail=f"AI Model is not ready: {model_manager.error_message or 'Model checkpoint still loading'}"
        )
        
    try:
        pil_image = decode_base64_image(request.image_base64)
        validate_image_dimensions(pil_image)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image preprocessing failed: {str(e)}")
        
    try:
        result = predict_single_image(
            image=pil_image,
            category=request.category,
            threshold=request.confidence_threshold
        )
        return PredictResponse(**result)
    except Exception as e:
        logger.error(f"Inference error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Inference failure: {str(e)}")

@app.post("/predict/upload", response_model=PredictResponse)
def predict_uploaded_file(file: UploadFile = File(...)):
    """
    Direct multipart/form-data upload endpoint for image testing.
    """
    if not model_manager.is_loaded:
        raise HTTPException(status_code=503, detail="AI Model is not ready")
        
    try:
        content = file.file.read()
        pil_image = Image.open(io.BytesIO(content))
        if pil_image.mode != "RGB":
            pil_image = pil_image.convert("RGB")
        validate_image_dimensions(pil_image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
        
    result = predict_single_image(pil_image)
    return PredictResponse(**result)

@app.post("/predict/sequence", response_model=SequencePredictResponse)
def predict_sequence(request: SequencePredictRequest):
    """
    Processes an ordered sequence of webcam frames with temporal smoothing and sign deduplication.
    """
    if not model_manager.is_loaded:
        raise HTTPException(status_code=503, detail="AI Model is not ready")
        
    if not request.frames_base64 or len(request.frames_base64) == 0:
        raise HTTPException(status_code=400, detail="Sequence must contain at least one frame")
        
    if len(request.frames_base64) > 30:
        raise HTTPException(status_code=400, detail="Maximum 30 frames allowed per sequence batch")
        
    pil_images = []
    for idx, f_b64 in enumerate(request.frames_base64):
        try:
            img = decode_base64_image(f_b64)
            pil_images.append(img)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error in frame index {idx}: {str(e)}")
            
    try:
        result = predict_sequence_frames(
            images=pil_images,
            min_stability_count=request.min_stability_count or 2
        )
        return SequencePredictResponse(**result)
    except Exception as e:
        logger.error(f"Sequence inference error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Sequence inference failure: {str(e)}")
