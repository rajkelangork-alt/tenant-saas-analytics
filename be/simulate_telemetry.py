import asyncio
import random
import uuid

import httpx

# Target backend configurations
API_BASE_URL = "http://127.0.0.1:8000/api/v1"
LOGIN_ENDPOINT = f"{API_BASE_URL}/auth/login"
EVENTS_ENDPOINT = f"{API_BASE_URL}/analytics/events"

# Tenant admin credentials
CREDENTIALS = {
    "email": "admin@tenant1.com",
    "password": "Admin@12345"
}

EVENT_POOL = [
    {"event_name": "api.request", "endpoint": "/api/v1/users", "status": 200},
    {"event_name": "dashboard.view", "endpoint": "/overview", "status": 200},
    {"event_name": "report.export", "endpoint": "/api/v1/reports", "status": 200},
    {"event_name": "user.session.heartbeat", "endpoint": "/ws/telemetry", "status": 101},
    {"event_name": "settings.update", "endpoint": "/api/v1/tenants/settings", "status": 204},
    {"event_name": "auth.refresh", "endpoint": "/api/v1/auth/refresh", "status": 200},
]


async def authenticate(client: httpx.AsyncClient) -> tuple[str, str]:
    """Authenticates and retrieves JWT bearer token & tenant UUID."""
    print("🔐 Authenticating telemetry client...")
    resp = await client.post(LOGIN_ENDPOINT, json=CREDENTIALS)
    if resp.status_code != 200:
        raise RuntimeError(f"Authentication failed: {resp.status_code} - {resp.text}")
    
    data = resp.json()
    token = data["access_token"]
    user = data.get("user", {})
    tenant_id = user.get("tenant_id")
    print(f"✅ Authenticated successfully! Tenant ID: {tenant_id}")
    return token, tenant_id


async def run_simulator():
    """Generates continuous stochastic ingress traffic."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            token, tenant_id = await authenticate(client)
        except (httpx.HTTPError, RuntimeError, KeyError) as err:
            print(f"❌ Aborting simulator: {err}")
            return

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        print(f"\n🚀 Ingress simulation started. Streaming telemetry to tenant {tenant_id}...")
        print("Press Ctrl+C to stop.\n")

        counter = 1
        while True:
            evt = random.choice(EVENT_POOL)
            latency = random.randint(9, 45)
            
            payload = {
                "event_name": evt["event_name"],
                "tenant_id": str(tenant_id),
                "payload": {
                    "endpoint": evt["endpoint"],
                    "status_code": evt["status"],
                    "latency_ms": latency,
                    "event_uuid": str(uuid.uuid4())[:8],
                    "client_ip": f"192.168.1.{random.randint(2, 250)}"
                }
            }

            try:
                resp = await client.post(EVENTS_ENDPOINT, json=payload, headers=headers)
                
                if resp.status_code in (200, 201, 202):
                    print(f"[{counter:04d}] Ingested: {evt['event_name']:<22} | Latency: {latency:2d}ms | Status: {evt['status']}")
                else:
                    print(f"[{counter:04d}] Ingestion responded {resp.status_code}. (Verifying payload format)")

            except httpx.HTTPError as err:
                print(f"[{counter:04d}] Transmission failed: {err}")

            counter += 1
            await asyncio.sleep(random.uniform(1.5, 3.5))


if __name__ == "__main__":
    try:
        asyncio.run(run_simulator())
    except KeyboardInterrupt:
        print("\n⏹ Simulation terminated cleanly.")