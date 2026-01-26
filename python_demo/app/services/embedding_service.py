# -*- coding: utf-8 -*-
import httpx
import hashlib
from typing import List, Optional, Dict
from ..core.config import settings


class EmbeddingService:
    """智谱 Embedding 服务 - 带简单缓存"""

    def __init__(self):
        self.api_key = settings.GLM_API_KEY
        self.api_url = settings.ZHIPU_EMBEDDING_URL
        self._cache: Dict[str, List[float]] = {}  # 简单内存缓存
        self._cache_max_size = 1000  # 最大缓存条目数

    def _get_cache_key(self, text: str) -> str:
        """生成缓存键"""
        return hashlib.md5(text.encode('utf-8')).hexdigest()

    def _get_from_cache(self, text: str) -> Optional[List[float]]:
        """从缓存获取向量"""
        key = self._get_cache_key(text)
        return self._cache.get(key)

    def _add_to_cache(self, text: str, embedding: List[float]):
        """添加向量到缓存"""
        if len(self._cache) >= self._cache_max_size:
            # 简单策略：清除一半缓存
            keys_to_remove = list(self._cache.keys())[:len(self._cache)//2]
            for key in keys_to_remove:
                del self._cache[key]

        key = self._get_cache_key(text)
        self._cache[key] = embedding

    async def get_embedding(self, text: str) -> Optional[List[float]]:
        """获取单条文本的向量（带缓存）"""
        if not text or not text.strip():
            return None

        # 检查缓存
        cached = self._get_from_cache(text)
        if cached:
            return cached

        embeddings = await self.get_embeddings([text])
        return embeddings[0] if embeddings else None

    async def get_embeddings(self, texts: List[str]) -> Optional[List[List[float]]]:
        """批量获取文本向量"""
        if not texts:
            return None

        # 过滤空文本
        texts = [t for t in texts if t and t.strip()]
        if not texts:
            return None

        try:
            results = []
            async with httpx.AsyncClient() as client:
                for text in texts:
                    # 先检查缓存
                    cached = self._get_from_cache(text)
                    if cached:
                        results.append(cached)
                        continue

                    # 调用API
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

                    # 添加到缓存
                    self._add_to_cache(text, embedding)

            return results
        except httpx.HTTPStatusError as e:
            print(f"Embedding API HTTP Error: {e.response.status_code} - {e.response.text}")
            return None
        except httpx.RequestError as e:
            print(f"Embedding API Request Error: {e}")
            return None
        except Exception as e:
            print(f"Embedding Service Error: {e}")
            return None

    def clear_cache(self):
        """清除向量缓存"""
        self._cache.clear()

    def get_cache_stats(self) -> dict:
        """获取缓存统计"""
        return {
            "cached_items": len(self._cache),
            "max_size": self._cache_max_size
        }


# 单例实例
embedding_service = EmbeddingService()
