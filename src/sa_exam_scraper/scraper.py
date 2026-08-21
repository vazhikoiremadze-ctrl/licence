import asyncio
import json
import logging
from pathlib import Path

from .client import SaApiClient, fetch_with_retry
from .constants import ExamCategory, ExamLanguage
from .models import Ticket

logger = logging.getLogger(__name__)

IMAGES_DIR_NAME = "images"


class Scraper:
    """Fetches tickets + descriptions + images for category/language combos."""

    def __init__(
        self,
        client: SaApiClient,
        output_dir: Path,
        concurrency: int = 10,
    ) -> None:
        self._client = client
        self._output_dir = output_dir
        self._images_dir = output_dir / IMAGES_DIR_NAME
        self._semaphore = asyncio.Semaphore(concurrency)
        # imageId values are reused across questions/languages -> download once
        self._image_lock = asyncio.Lock()
        self._downloaded_images: set[int] = set()

    async def run(
        self,
        categories: list[ExamCategory],
        languages: list[ExamLanguage],
    ) -> None:
        self._images_dir.mkdir(parents=True, exist_ok=True)
        tasks = [
            asyncio.create_task(self._scrape_combo(cat, lang))
            for cat in categories
            for lang in languages
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        failures = [r for r in results if isinstance(r, BaseException)]
        done = len(results) - len(failures)
        logger.info("Finished %d/%d combos (%d failed)", done, len(results), len(failures))
        for exc in failures:
            logger.error("Combo failed: %r", exc)

    async def _scrape_combo(self, category: ExamCategory, language: ExamLanguage) -> None:
        raw_tickets = await fetch_with_retry(
            lambda: self._client.get_tickets(category.value, language.value)
        )
        tickets = [Ticket.from_api(t) for t in raw_tickets]
        logger.info("%s/%s: %d tickets", category.name, language.slug, len(tickets))

        await asyncio.gather(*(self._enrich_ticket(t) for t in tickets))

        out_path = self._output_dir / f"{category.name}-{language.slug}.json"
        out_path.write_text(
            json.dumps([t.to_dict() for t in tickets], ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        logger.info("Wrote %s", out_path)

    async def _enrich_ticket(self, ticket: Ticket) -> None:
        # Each fetch task takes its own semaphore slot; wrapping the whole
        # thing here too could deadlock when all slots are held by waiters.
        ticket.description, _ = await asyncio.gather(
            self._fetch_description(ticket),
            self._fetch_image(ticket),
        )

    async def _fetch_description(self, ticket: Ticket) -> str | None:
        try:
            return await fetch_with_retry(
                lambda: self._client.get_description(ticket.exam_ticket_id)
            )
        except Exception:
            logger.exception("Description failed for examTicketId=%s", ticket.exam_ticket_id)
            return None

    async def _fetch_image(self, ticket: Ticket) -> bool:
        if ticket.image_id is None:
            return False
        image_id = ticket.image_id

        async with self._image_lock:
            already_done = image_id in self._downloaded_images
            if not already_done:
                self._downloaded_images.add(image_id)
        if already_done or (self._images_dir / f"{image_id}.jpg").exists():
            return True

        async with self._semaphore:
            try:
                data = await fetch_with_retry(lambda: self._client.get_image(image_id))
                (self._images_dir / f"{image_id}.jpg").write_bytes(data)
            except Exception:
                logger.exception("Image download failed for imageId=%s", image_id)
                return False
        return True
