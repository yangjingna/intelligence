from typing import Dict, Set
from fastapi import WebSocket
import json


class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
        self.online_users: Set[int] = set()

    async def broadcast(self, message: dict):
        """向所有在线用户广播消息"""
        for uid, connection in self.active_connections.items():
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                pass

    async def broadcast_demand_published(self, demand):
        """广播新研发需求发布"""
        message = {
            "type": "demand_published",
            "payload": {
                "demand_id": demand.id,
                "title": demand.title,
                "enterprise_name": demand.enterprise_name,
                "research_area": demand.research_area,
                "priority": demand.priority.value if demand.priority else None,
                "created_at": demand.created_at.isoformat() if demand.created_at else None
            }
        }
        await self.broadcast(message)

    async def broadcast_barrier_published(self, barrier):
        """广播新技术壁垒发布"""
        message = {
            "type": "barrier_published",
            "payload": {
                "barrier_id": barrier.id,
                "title": barrier.title,
                "enterprise_name": barrier.enterprise_name,
                "technical_area": barrier.technical_area,
                "difficulty": barrier.difficulty.value if barrier.difficulty else None,
                "created_at": barrier.created_at.isoformat() if barrier.created_at else None
            }
        }
        await self.broadcast(message)

    async def broadcast_achievement_published(self, achievement):
        """广播新研发成果发布"""
        message = {
            "type": "achievement_published",
            "payload": {
                "achievement_id": achievement.id,
                "title": achievement.title,
                "university_name": achievement.university_name,
                "research_area": achievement.research_area,
                "created_at": achievement.created_at.isoformat() if achievement.created_at else None
            }
        }
        await self.broadcast(message)

    async def broadcast_project_signed(self, project):
        """广播项目签约通知"""
        message = {
            "type": "project_signed",
            "payload": {
                "project_id": project.id,
                "title": project.title,
                "created_at": project.created_at.isoformat() if project.created_at else None
            }
        }
        await self.broadcast(message)

    async def broadcast_project_completed(self, project):
        """广播项目完成通知"""
        message = {
            "type": "project_completed",
            "payload": {
                "project_id": project.id,
                "title": project.title,
                "created_at": project.created_at.isoformat() if project.created_at else None
            }
        }
        await self.broadcast(message)

    async def send_inquiry_notification(self, inquiry):
        """发送新咨询通知给目标用户"""
        message = {
            "type": "new_inquiry",
            "payload": {
                "inquiry_id": inquiry.id,
                "subject": inquiry.subject,
                "inquirer_name": inquiry.inquirer_name,
                "inquiry_role": inquiry.inquirer_role,
                "created_at": inquiry.created_at.isoformat() if inquiry.created_at else None
            }
        }
        # 发送给目标用户
        await self.send_message(inquiry.target_user_id, message)

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
