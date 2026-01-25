from typing import Dict, Set
from fastapi import WebSocket
import json


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
        self.online_users: Set[int] = set()

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.online_users.add(user_id)
        # Broadcast online status
        await self.broadcast_status(user_id, True)

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        self.online_users.discard(user_id)

    async def broadcast_status(self, user_id: int, is_online: bool):
        message = {
            "type": "online_status",
            "payload": {
                "userId": user_id,
                "isOnline": is_online
            }
        }
        for uid, connection in self.active_connections.items():
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass

    async def send_message(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(message))
                return True
            except Exception:
                return False
        return False

    def is_user_online(self, user_id: int) -> bool:
        return user_id in self.online_users

    def get_online_users(self) -> Set[int]:
        return self.online_users.copy()


ws_manager = WebSocketManager()
