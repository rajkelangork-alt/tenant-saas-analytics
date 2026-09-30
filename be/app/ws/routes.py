import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.websocket_service import ws_manager

router = APIRouter(tags=["WebSockets"])


@router.websocket("/ws/{tenant_id}")
async def tenant_websocket(websocket: WebSocket, tenant_id: uuid.UUID) -> None:
    await ws_manager.connect(tenant_id, websocket)
    try:
        while True:
            # Echo or process client messages, keep-alive heartbeat
            data = await websocket.receive_text()
            await ws_manager.broadcast_to_tenant(
                tenant_id,
                {"event": "client_message", "payload": data},
            )
    except (WebSocketDisconnect, RuntimeError):
        ws_manager.disconnect(tenant_id, websocket)