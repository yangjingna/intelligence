from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import json

from .core.config import settings
from .core.database import engine, Base
from .core.security import decode_token
from .api import api_router
from .services.websocket_manager import ws_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create database tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title="产学研智能交互系统 API",
    description="基于大模型的产学研智能交互系统后端API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "产学研智能交互系统 API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(None)
):
    # First accept the WebSocket connection
    await websocket.accept()

    # Then verify token
    if not token:
        await websocket.close(code=4001, reason="No token provided")
        return

    payload = decode_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id_str = payload.get("sub")
    if not user_id_str:
        await websocket.close(code=4001, reason="Invalid token payload")
        return

    # sub 是字符串，需要转换为整数
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        await websocket.close(code=4001, reason="Invalid user id")
        return

    # Register connection with manager
    print(f"[WS] 用户 {user_id} WebSocket连接成功")
    ws_manager.active_connections[user_id] = websocket
    ws_manager.online_users.add(user_id)

    # 先发送当前在线用户列表给新连接的用户
    await ws_manager.send_online_users_list(websocket)
    # 再广播新用户上线状态
    await ws_manager.broadcast_status(user_id, True)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                msg_type = message.get("type")
                payload = message.get("payload", {})

                if msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))

                elif msg_type == "typing":
                    # Notify the other user that this user is typing
                    conversation_id = payload.get("conversationId")
                    # You could implement typing indicator here

            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        ws_manager.disconnect(user_id)
        await ws_manager.broadcast_status(user_id, False)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
