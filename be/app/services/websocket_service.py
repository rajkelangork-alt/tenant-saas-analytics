import uuid
from collections import defaultdict
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect


class WebSocketManager:
    def __init__(self) -> None:
        self.active_connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, tenant_id: uuid.UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections[str(tenant_id)].append(websocket)

    def disconnect(self, tenant_id: uuid.UUID, websocket: WebSocket) -> None:
        tenant_str = str(tenant_id)
        if tenant_str in self.active_connections:
            if websocket in self.active_connections[tenant_str]:
                self.active_connections[tenant_str].remove(websocket)
            if not self.active_connections[tenant_str]:
                del self.active_connections[tenant_str]

    async def broadcast_to_tenant(
        self, tenant_id: uuid.UUID, message: dict[str, Any]
    ) -> None:
        tenant_str = str(tenant_id)
        connections = self.active_connections.get(tenant_str, [])
        disconnected: list[WebSocket] = []

        for connection in connections:
            try:
                await connection.send_json(message)
            except (WebSocketDisconnect, RuntimeError, ConnectionResetError):
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(tenant_id, conn)


ws_manager = WebSocketManager()