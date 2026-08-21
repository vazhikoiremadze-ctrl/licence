"""Download any images referenced by scraped JSON files but missing on disk."""

import asyncio
import json
import logging
from pathlib import Path

import aiohttp

from .client import SaApiClient

logger = logging.getLogger(__name__)


async def backfill_images(output_dir: Path, concurrency: int = 5) -> None:
    images_dir = output_dir / "images"
    ids: set[int] = set()
    for f in sorted(output_dir.glob("*.json")):
        data = json.loads(f.read_text(encoding="utf-8"))
        ids |= {t["imageId"] for t in data if t.get("imageId")}
    missing = sorted(i for i in ids if not (images_dir / f"{i}.jpg").exists())
    logger.info("%d images missing", len(missing))
    if not missing:
        return

    semaphore = asyncio.Semaphore(concurrency)

    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=60)) as session:
        client = SaApiClient(session)

        async def fetch(i: int) -> None:
            async with semaphore:
                try:
                    (images_dir / f"{i}.jpg").write_bytes(await client.get_image(i))
                except Exception as exc:
                    logger.warning("imageId=%s failed: %s", i, exc)

        await asyncio.gather(*(fetch(i) for i in missing))


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--concurrency", type=int, default=5)
    args = parser.parse_args()
    asyncio.run(backfill_images(args.output_dir, args.concurrency))


if __name__ == "__main__":
    main()
