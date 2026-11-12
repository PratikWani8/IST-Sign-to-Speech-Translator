import time
import torch
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image

from .model_loader import model_manager
from .vocabulary import ISL_VOCABULARY, get_sign_details
from .preprocessing import center_crop_square, detect_and_crop_hand
from .config import settings

def _run_vit_forward(image: Image.Image) -> Tuple[str, float, float, List[Dict[str, Any]]]:
    """
    Executes a single forward pass of the Vision Transformer on a PIL image.
    Returns (top_pred, top_conf, second_conf, alternatives).
    """
    inputs = model_manager.processor(images=image, return_tensors="pt")
    inputs = {k: v.to(model_manager.device) for k, v in inputs.items()}
    
    with torch.no_grad():
        outputs = model_manager.model(**inputs)
        logits = outputs.logits
        probabilities = torch.nn.functional.softmax(logits, dim=-1)[0]
        
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
    return top_pred, top_conf, second_conf, alternatives

def predict_single_image(
    image: Image.Image,
    category: Optional[str] = None,
    threshold: Optional[float] = None
) -> Dict[str, Any]:
    """
    Performs real Vision Transformer inference on an input PIL image.
    Applies multi-crop evaluation (guide crop, skin ROI, horizontal TTA)
    when confidence or aspect ratio indicates ambiguous hand positioning.
    """
    if not model_manager.is_loaded:
        if not model_manager.load_model():
            raise RuntimeError(f"Model checkpoint is not loaded: {model_manager.error_message}")
            
    conf_threshold = threshold if threshold is not None else settings.CONFIDENCE_THRESHOLD
    
    start_time = time.perf_counter()
    
    # 1. Base inference on provided input image
    top_pred, top_conf, second_conf, alternatives = _run_vit_forward(image)
    best_pred, best_conf, best_second, best_alts = top_pred, top_conf, second_conf, alternatives
    
    # 2. Multi-crop / ROI adaptive evaluation if confidence is moderate or frame is non-square
    if best_conf < 0.70 or image.width != image.height:
        # A. Try center square crop if aspect ratio is non-square
        if image.width != image.height:
            center_crop = center_crop_square(image)
            c_pred, c_conf, c_sec, c_alts = _run_vit_forward(center_crop)
            if c_conf > best_conf:
                best_pred, best_conf, best_second, best_alts = c_pred, c_conf, c_sec, c_alts
                
        # B. Try OpenCV skin segmentation hand ROI if still moderate confidence
        if best_conf < 0.75:
            hand_roi = detect_and_crop_hand(image)
            if hand_roi is not None:
                h_pred, h_conf, h_sec, h_alts = _run_vit_forward(hand_roi)
                if h_conf > best_conf:
                    best_pred, best_conf, best_second, best_alts = h_pred, h_conf, h_sec, h_alts
                    
        # C. Try horizontal flip (TTA) to handle left-handed or mirrored camera orientation
        if best_conf < 0.65:
            flipped = image.transpose(Image.FLIP_LEFT_RIGHT)
            f_pred, f_conf, f_sec, f_alts = _run_vit_forward(flipped)
            if f_conf > (best_conf + 0.15):
                best_pred, best_conf, best_second, best_alts = f_pred, f_conf, f_sec, f_alts

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    
    # Assess certainty and quality
    is_confident = best_conf >= conf_threshold
    uncertainty_reason = None
    status = "success"
    
    if not is_confident:
        status = "uncertain"
        uncertainty_reason = f"Confidence score ({best_conf:.1%}) is below certainty threshold ({conf_threshold:.1%}). Align hand inside the guide box with clear lighting."
    elif best_conf < 0.70 and (best_conf - best_second) < 0.08:
        # Ambiguous between top two signs only when confidence is low
        alt_label = best_alts[1]["label"]
        status = "uncertain"
        uncertainty_reason = f"Ambiguous gesture between '{best_pred}' ({best_conf:.1%}) and '{alt_label}' ({best_second:.1%}). Hold sign steady."
        
    # Category constraint checking
    if category and category.lower() not in ["all", "everyday"] and is_confident:
        sign_info = get_sign_details(best_pred)
        if sign_info and category.lower() not in [c.lower() for c in sign_info.get("categories", [])]:
            uncertainty_reason = f"Recognized '{best_pred}', which is not in the active '{category}' category filter."
            
    return {
        "status": status,
        "predicted_sign": best_pred,
        "confidence": best_conf,
        "is_confident": is_confident and (status == "success"),
        "uncertainty_reason": uncertainty_reason,
        "alternatives": best_alts,
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
