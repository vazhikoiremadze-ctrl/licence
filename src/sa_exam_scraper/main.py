import argparse
import asyncio
import logging
from pathlib import Path

import aiohttp

from .client import SaApiClient
from .constants import ExamCategory, ExamLanguage
from .scraper import Scraper


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scrape Georgian driving license exam tickets."
    )
    parser.add_argument(
        "-o",
        "--output-dir",
        type=Path,
        default=Path("output"),
        help="Directory for JSON files and the images/ folder (default: ./output)",
    )
    parser.add_argument(
        "-c",
        "--categories",
        type=lambda s: s.split(","),
        default=None,
        help="Comma-separated category enum names (e.g. B_B1,C). Default: all.",
    )
    parser.add_argument(
        "-l",
        "--languages",
        type=lambda s: s.split(","),
        default=None,
        help="Comma-separated language codes (e.g. KA,EN). Default: all.",
    )
    parser.add_argument(
        "--concurrency", type=int, default=10, help="Max parallel requests (default: 10)"
    )
    return parser.parse_args()


def resolve_enum(enum_cls, names: list[str] | None):
    if not names:
        return list(enum_cls)
    return [enum_cls[n.strip().upper()] for n in names]


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    args = parse_args()

    categories = resolve_enum(ExamCategory, args.categories)
    languages = resolve_enum(ExamLanguage, args.languages)

    async def run() -> None:
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=60)
        ) as session:
            scraper = Scraper(SaApiClient(session), args.output_dir, args.concurrency)
            await scraper.run(categories, languages)

    asyncio.run(run())


if __name__ == "__main__":
    main()
