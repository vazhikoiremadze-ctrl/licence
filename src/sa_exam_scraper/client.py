import asyncio
from typing import Any

import aiohttp

BASE_URL = "https://api-my.sa.gov.ge/api/v1"


class SaApiClient:
    """Thin async wrapper around the SA driving-license exam API."""

    def __init__(self, session: aiohttp.ClientSession) -> None:
        self._session = session

    async def get_tickets(self, category_id: int, language_id: int) -> list[dict[str, Any]]:
        url = f"{BASE_URL}/DrivingLicenseExams/GetDrivingLicenseTickets"
        params = {"CategoryId": category_id, "LanguageId": language_id}
        return await self._get_json(url, params)

    async def get_description(self, exam_ticket_id: int) -> str:
        url = f"{BASE_URL}/DrivingLicenseExams/Description"
        data = await self._get_text(url, {"examTicketId": exam_ticket_id})
        return data.strip()

    async def get_image(self, image_id: int) -> bytes:
        url = f"{BASE_URL}/DrivingLicenseExams/GetTicketImage/"
        async with self._session.get(url, params={"imageId": image_id}) as resp:
            resp.raise_for_status()
            return await resp.read()

    async def _get_json(self, url: str, params: dict[str, Any]) -> Any:
        async with self._session.get(url, params=params) as resp:
            resp.raise_for_status()
            return await resp.json()

    async def _get_text(self, url: str, params: dict[str, Any]) -> str:
        async with self._session.get(url, params=params) as resp:
            resp.raise_for_status()
            return await resp.text()


async def fetch_with_retry(coro_factory, retries: int = 3):
    """Run an awaitable factory with simple linear backoff on failure."""
    for attempt in range(1, retries + 1):
        try:
            return await coro_factory()
        except aiohttp.ClientError:
            if attempt == retries:
                raise
            await asyncio.sleep(attempt)
