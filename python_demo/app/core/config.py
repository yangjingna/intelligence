from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "mysql+pymysql://root:123456@localhost:3306/intelligence_db"

    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # GLM API
    GLM_API_KEY: str = "e6236095d7084fbd9aaaf198f005f347.l6gzd7zGZxn6TOyP"
    GLM_API_URL: str = "https://open.bigmodel.cn/api/paas/v4/chat/completions"

    # 智谱 Embedding API
    ZHIPU_EMBEDDING_URL: str = "https://open.bigmodel.cn/api/paas/v4/embeddings"

    # ChromaDB 配置
    CHROMADB_PATH: str = "./chromadb_data"

    # RAG 配置
    RAG_TOP_K: int = 5
    RAG_SIMILARITY_THRESHOLD: float = 0.7

    # Redis 配置 (短时记忆)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""
    CHAT_CONTEXT_TTL: int = 3600  # 聊天上下文过期时间（秒），默认1小时

    # 智能客服配置
    CS_MAX_CONTEXT_MESSAGES: int = 20  # 客服上下文最大消息数
    CS_RAG_TOP_K: int = 3  # 客服RAG检索数量
    CS_SIMILARITY_THRESHOLD: float = 0.7  # 客服RAG相似度阈值

    # CORS
    CORS_ORIGINS: list = ["*"]

    class Config:
        env_file = ".env"
        
    REDIS_ENABLED: bool = False  # 默认关闭Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""

@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
