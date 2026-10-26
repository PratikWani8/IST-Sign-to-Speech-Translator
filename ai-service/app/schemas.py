from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AlternativePrediction(BaseModel):
    label: str
    confidence: float

class PredictRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded JPEG or PNG image frame")
    category: Optional[str] = Field(None, description="Optional category filter (e.g., healthcare, banking, education, everyday)")
    confidence_threshold: Optional[float] = Field(None, description="Custom threshold to override default (0.0 to 1.0)")

class PredictResponse(BaseModel):
    status: str = Field(..., description="'success', 'uncertain', 'unsupported', or 'error'")
    predicted_sign: Optional[str] = Field(None, description="Confirmed or top predicted sign character")
    confidence: float = Field(..., description="Calculated softmax probability for the top prediction")
    is_confident: bool = Field(..., description="True if confidence >= threshold")
    uncertainty_reason: Optional[str] = Field(None, description="Reason if prediction is uncertain or ambiguous")
    alternatives: List[AlternativePrediction] = Field(default_factory=list, description="Top alternative predictions with confidences")
    processing_time_ms: float = Field(..., description="Time taken to process frame in milliseconds")
    model_id: str = Field(..., description="Identifier of the inference model")

class SequencePredictRequest(BaseModel):
    frames_base64: List[str] = Field(..., description="Ordered list of base64 encoded frames (sampled temporal sequence)")
    fps: Optional[float] = Field(10.0, description="Sampling rate of provided frames")
    min_stability_count: Optional[int] = Field(2, description="Minimum consecutive frames required for stable sign recognition")

class SequencePredictResponse(BaseModel):
    status: str
    decoded_signs: List[str]
    decoded_text: str
    total_frames_processed: int
    processing_time_ms: float
    model_id: str

class SignItem(BaseModel):
    id: str
    name: str
    type: str  # 'letter' or 'digit'
    description: str
    categories: List[str]
    example_usage: str
    visual_guide_url: Optional[str] = None

class VocabularyResponse(BaseModel):
    total_signs: int
    supported_types: List[str]
    categories: List[str]
    vocabulary: List[SignItem]

class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    architecture: str
    supported_input_format: str
    supported_vocabulary_count: int
    inference_device: str
    is_ready: bool
    confidence_threshold: float
    known_limitations: List[str]
    attribution: Dict[str, str]

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    device: str
    version: str
    timestamp: float
