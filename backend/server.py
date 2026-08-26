"""
Thin FastAPI reverse-proxy used ONLY for the Emergent preview environment.

Emergent's ingress routes every `/api/*` request to this process on :8001
and everything else to the Next.js dev server on :3000. Because the real
application is a Next.js app (with its own /api route handlers) running on
:3000, we simply forward /api/* to it and keep all business logic in Next.

This file is NOT used in the Cloudflare Workers production deployment.
"""
import os
import asyncio
import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse, StreamingResponse

NEXT_UPSTREAM = os.environ.get("NEXT_UPSTREAM", "http://127.0.0.1:3000")
TIMEOUT = httpx.Timeout(120.0, connect=5.0)

app = FastAPI(title="Errant-Arts dev proxy", docs_url=None, redoc_url=None)
_client: httpx.AsyncClient | None = None


@app.on_event("startup")
async def _startup() -> None:
    global _client
    _client = httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=False)


@app.on_event("shutdown")
async def _shutdown() -> None:
    if _client is not None:
        await _client.aclose()


@app.get("/api/health-proxy")
async def health_proxy() -> JSONResponse:
    """Internal health check that also confirms Next.js is reachable."""
    try:
        assert _client is not None
        r = await _client.get(f"{NEXT_UPSTREAM}/api/health")
        return JSONResponse({"proxy": "ok", "next_status": r.status_code})
    except Exception as exc:  # noqa: BLE001
        return JSONResponse({"proxy": "ok", "next_error": str(exc)}, status_code=502)


HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "content-length",
    "content-encoding",
}


async def _wait_for_next(max_seconds: int = 90) -> bool:
    """Wait until Next.js dev server on :3000 starts accepting connections."""
    assert _client is not None
    for _ in range(max_seconds * 2):
        try:
            await _client.get(f"{NEXT_UPSTREAM}/api/health", timeout=2.0)
            return True
        except Exception:  # noqa: BLE001
            await asyncio.sleep(0.5)
    return False


@app.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy(path: str, request: Request) -> Response:
    assert _client is not None
    target = f"{NEXT_UPSTREAM}/api/{path}"
    if request.url.query:
        target = f"{target}?{request.url.query}"

    body = await request.body()
    headers = {
        k: v
        for k, v in request.headers.items()
        if k.lower() not in HOP_BY_HOP and k.lower() != "host"
    }
    # Preserve original client IP for Next.js server code
    headers.setdefault("x-forwarded-for", request.client.host if request.client else "")
    headers.setdefault("x-forwarded-proto", request.url.scheme)

    try:
        upstream = await _client.request(
            request.method,
            target,
            content=body,
            headers=headers,
        )
    except (httpx.ConnectError, httpx.ReadError):
        # Next.js may still be starting up on cold boot; wait once.
        if not await _wait_for_next():
            return JSONResponse(
                {"error": "Next.js dev server not reachable on :3000"},
                status_code=502,
            )
        upstream = await _client.request(
            request.method,
            target,
            content=body,
            headers=headers,
        )

    resp_headers = {
        k: v for k, v in upstream.headers.items() if k.lower() not in HOP_BY_HOP
    }
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=resp_headers,
        media_type=upstream.headers.get("content-type"),
    )
