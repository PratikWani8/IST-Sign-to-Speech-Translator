import os
import logging
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification
from .config import settings

# Suppress noisy TensorFlow logs if present in runtime
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["HF_HUB_OFFLINE"] = "1"

logger = logging.getLogger(__name__)

class ModelManager:
    _instance = None
    
    def __init__(self):
        self.model = None
        self.processor = None
        self.is_loaded = False
        self.device = torch.device(settings.DEVICE if torch.cuda.is_available() and settings.DEVICE == "cuda" else "cpu")
        self.error_message = None
        self.label_map = {}
        
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ModelManager()
        return cls._instance

    def load_model(self):
        if self.is_loaded:
            return True
            
        model_path = settings.MODEL_DIR
        logger.info(f"Loading ISL Vision Transformer model from: {model_path}")
        
        try:
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"Model directory does not exist: {model_path}")
                
            self.processor = AutoImageProcessor.from_pretrained(model_path, local_files_only=True)
            self.model = AutoModelForImageClassification.from_pretrained(model_path, local_files_only=True)
            self.model.to(self.device)
            self.model.eval()
            
            # Map configuration id2label
            self.label_map = self.model.config.id2label
            self.is_loaded = True
            self.error_message = None
            logger.info(f"Model successfully loaded on {self.device}. Vocabulary size: {len(self.label_map)}")
            return True
        except Exception as e:
            self.is_loaded = False
            self.error_message = str(e)
            logger.error(f"Failed to load model: {e}", exc_info=True)
            return False

model_manager = ModelManager.get_instance()
