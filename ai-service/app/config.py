import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    APP_NAME: str = "ISL Sign-to-Speech AI Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Model configuration
    MODEL_NAME: str = "Hemg/Indian-sign-language-classification"
    MODEL_DIR: str = os.getenv(
        "MODEL_DIR",
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "isl_vit")
    )
    CONFIDENCE_THRESHOLD: float = 0.55
    DEVICE: str = "cpu"  # 'cuda' or 'cpu'
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5000",
        "*"
    ]
    
    # Limits
    MAX_IMAGE_SIZE_MB: int = 10
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
