import time
import torch
from typing import Dict, Any, List, Optional
from PIL import Image

from .model_loader import model_manager
from .vocabulary import ISL_VOCABULARY, get_sign_details
from .config import settings

def predict_single_image(
    image: Image.Image,
    category: Optional[str] = None,
    threshold: Optional[float] = None
) -> Dict[str, Any]:
    """
    Performs real Vision Transformer inference on an input PIL image.
    Returns predicted sign, softmax confidence distribution, alternative predictions,
    and honest certainty assessment.
    """
    if not model_manager.is_loaded:
        if not model_manager.load_model():
            raise RuntimeError(f"Model checkpoint is not loaded: {model_manager.error_message}")
            
    conf_threshold = threshold if threshold is not None else settings.CONFIDENCE_THRESHOLD
    
    start_time = time.perf_counter()
    
    # Preprocess image
    inputs = model_manager.processor(images=image, return_tensors="pt")
    inputs = {k: v.to(model_manager.device) for k, v in inputs.items()}
    
    with torch.no_grad():
        outputs = model_manager.model(**inputs)
        logits = outputs.logits
        probabilities = torch.nn.functional.softmax(logits, dim=-1)[0]
        
    # Get top 5 predictions
    top_k = min(5, len(model_manager.label_map))
    top_probs, top_indices = torch.topk(probabilities, top_k)
    
    alternatives = []
    for prob, idx in zip(top_probs, top_indices):
        label = model_manager.label_map[idx.item()]
        alternatives.append({
            "label": label,
            "confidence": round(prob.item(), 4)
        })
        
    top_pred = alternatives[0]["label"]
    top_conf = alternatives[0]["confidence"]
    second_conf = alternatives[1]["confidence"] if len(alternatives) > 1 else 0.0
    
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    
    # Assess certainty and quality
    is_confident = top_conf >= conf_threshold
    uncertainty_reason = None
    status = "success"
    
    if not is_confident:
        status = "uncertain"
        uncertainty_reason = f"Confidence score ({top_conf:.1%}) is below certainty threshold ({conf_threshold:.1%}). Ensure adequate lighting and center hands in frame."
    elif (top_conf - second_conf) < 0.15:
        # Ambiguous between top two signs
        alt_label = alternatives[1]["label"]
        status = "uncertain"
        uncertainty_reason = f"Ambiguous gesture between '{top_pred}' ({top_conf:.1%}) and '{alt_label}' ({second_conf:.1%}). Hold sign steady."
        
    # Category constraint checking
    if category and category.lower() != "all" and is_confident:
        sign_info = get_sign_details(top_pred)
        if sign_info and category.lower() not in [c.lower() for c in sign_info.get("categories", [])]:
            # The sign is recognized, but doesn't strictly belong to this specialized domain
            uncertainty_reason = f"Recognized '{top_pred}', which is not in the active '{category}' category filter."
            
    return {
        "status": status,
        "predicted_sign": top_pred,
        "confidence": top_conf,
        "is_confident": is_confident and (status == "success"),
        "uncertainty_reason": uncertainty_reason,
        "alternatives": alternatives,
        "processing_time_ms": round(elapsed_ms, 2),
        "model_id": settings.MODEL_NAME
    }

def predict_sequence_frames(
    images: List[Image.Image],
    min_stability_count: int = 2
) -> Dict[str, Any]:
    """
    Processes a temporal sequence of frames.
    Performs frame-by-frame inference and applies temporal stability
    and cooldown deduplication to prevent duplicate insertions when a sign is held.
    """
    start_time = time.perf_counter()
    raw_predictions = []
    
    for img in images:
        pred_res = predict_single_image(img)
        if pred_res["status"] == "success" and pred_res["is_confident"]:
            raw_predictions.append(pred_res["predicted_sign"])
        else:
            raw_predictions.append(None)
            
    # Apply temporal stability and hold deduplication
    decoded_signs: List[str] = []
    current_sign = None
    streak = 0
    last_confirmed_sign = None
    
    for sign in raw_predictions:
        if sign is None:
            # Transition or blank frame
            streak = 0
            current_sign = None
            continue
            
        if sign == current_sign:
            streak += 1
        else:
            current_sign = sign
            streak = 1
            
        # If sign is held for at least min_stability_count frames and not already confirmed
        if streak >= min_stability_count and current_sign != last_confirmed_sign:
            decoded_signs.append(current_sign)
            last_confirmed_sign = current_sign
            
    decoded_text = "".join(decoded_signs)
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    
    return {
        "status": "success",
        "decoded_signs": decoded_signs,
        "decoded_text": decoded_text,
        "total_frames_processed": len(images),
        "processing_time_ms": round(elapsed_ms, 2),
        "model_id": settings.MODEL_NAME
    }
