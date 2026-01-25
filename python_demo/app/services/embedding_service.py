# -*- coding: utf-8 -*-
import httpx
from typing import List, Optional
from ..core.config import settings


class EmbeddingService:
    """智谱 Embedding 服务"""

    def __init__(self):
        self.api_key = settings.GLM_API_KEY
        self.api_url = settings.ZHIPU_EMBEDDING_URL

    async def get_embedding(self, text: str) -> Optional[List[float]]:
        """获取单条文本的向量"""
        embeddings = await self.get_embeddings([text])
        return embeddings[0] if embeddings else None

    async def get_embeddings(self, texts: List[str]) -> Optional[List[List[float]]]:
        """批量获取文本向量"""
        if not texts:
            return None

        try:
            results = []
            async with httpx.AsyncClient() as client:
                # 智谱 API 每次只能处理一条文本
                for text in texts:
                    response = await client.post(
                        self.api_url,
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "embedding-2",
                            "input": text
                        },
                        timeout=30.0
                    )
                    response.raise_for_status()
                    data = response.json()
                    embedding = data["data"][0]["embedding"]
                    results.append(embedding)
            return results
        except Exception as e:
            print(f"Embedding Service Error: {e}")
            return None


# 单例实例
embedding_service = EmbeddingService()
