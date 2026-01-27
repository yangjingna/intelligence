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

    async def send_online_users_list(self, websocket: WebSocket):
        """发送当前所有在线用户列表给新连接的用户"""
        message = {
            "type": "online_users_list",
            "payload": {
                "userIds": list(self.online_users)
            }
        }
        try:
            await websocket.send_text(json.dumps(message))
            print(f"[WS] 发送在线用户列表: {list(self.online_users)}")
        except Exception as e:
            print(f"[WS] 发送在线用户列表失败: {e}")

    async def send_message(self, user_id: int, message: dict):
        print(f"[WS] 尝试发送消息给用户 {user_id}, 当前在线用户: {list(self.active_connections.keys())}")
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_text(json.dumps(message))
                print(f"[WS] 消息发送成功给用户 {user_id}")
                return True
            except Exception as e:
                print(f"[WS] 消息发送失败: {e}")
                return False
        print(f"[WS] 用户 {user_id} 不在线，无法发送消息")
        return False

    def is_user_online(self, user_id: int) -> bool:
        return user_id in self.online_users

    def get_online_users(self) -> Set[int]:
        return self.online_users.copy()


ws_manager = WebSocketManager()
