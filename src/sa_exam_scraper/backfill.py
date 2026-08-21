"""Backfill descriptions for tickets whose description is null in existing JSON files."""

import asyncio
import json
import logging
from pathlib import Path

import aiohttp

from .client import SaApiClient, fetch_with_retry

logger = logging.getLogger(__name__)


async def _backfill_file(
    client: SaApiClient,
    path: Path,
    semaphore: asyncio.Semaphore,
) -> tuple[int, int]:
    data = json.loads(path.read_text(encoding="utf-8"))
    missing = [t for t in data if not t.get("description")]

    async def fetch_one(ticket: dict) -> None:
        async with semaphore:
            try:
                desc = await fetch_with_retry(
                    lambda: client.get_description(ticket["examTicketId"]), retries=5
                )
                if desc:
                    ticket["description"] = desc
            except Exception as exc:
                logger.warning(
                    "examTicketId=%s still failing: %s", ticket["examTicketId"], exc
                )

    await asyncio.gather(*(fetch_one(t) for t in missing))
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    filled = sum(1 for t in data if t.get("description")) - (
        len(data) - len(missing)
    )
    return len(missing), max(filled, 0)


async def backfill(output_dir: Path, concurrency: int = 5) -> None:
    files = sorted(output_dir.glob("*.json"))
    semaphore = asyncio.Semaphore(concurrency)
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
        client = SaApiClient(session)
        for f in files:
            missing, filled = await _backfill_file(client, f, semaphore)
            logger.info("%s: %d/%d filled", f.name, filled, missing)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--concurrency", type=int, default=5)
    args = parser.parse_args()
    asyncio.run(backfill(args.output_dir, args.concurrency))


if __name__ == "__main__":
    main()
