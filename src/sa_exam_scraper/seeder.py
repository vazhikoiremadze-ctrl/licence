"""Seed the SQLite DB from the scraped JSON files in the output directory."""

import argparse
import json
import logging
from pathlib import Path

from .constants import ExamCategory, ExamLanguage
from .db import writer

logger = logging.getLogger(__name__)

DB_FILE_NAME = "exam_tickets.db"

# In-memory identity maps: (category_id, exam_ticket_id) -> question id, etc.
QuestionKey = tuple[int, int]
AnswerKey = tuple[int, int]


class Seeder:
    """Collects rows from JSON files and bulk-inserts them with explicit ids."""

    def __init__(self) -> None:
        self._next_id = 0
        self.categories: list[tuple[int, str]] = []
        self.languages: list[tuple[int, str]] = []
        self.questions: list[tuple[int, int, int, int | None, int]] = []
        self.answers: list[tuple[int, int, int]] = []
        # (entity_type, entity_id, language_id, text, description)
        self.translations: list[tuple[str, int, int, str, str | None]] = []
        self._question_ids: dict[QuestionKey, int] = {}
        self._answer_ids: dict[AnswerKey, int] = {}

    def _id(self) -> int:
        self._next_id += 1
        return self._next_id

    def load_reference(self) -> None:
        self.categories = [(c.value, c.name) for c in ExamCategory]
        self.languages = [(l.value, l.slug) for l in ExamLanguage]

    def load_file(
        self,
        data_file: Path,
        category: ExamCategory,
        language: ExamLanguage,
    ) -> None:
        tickets = json.loads(data_file.read_text(encoding="utf-8"))
        for ticket in tickets:
            q_key: QuestionKey = (category.value, ticket["examTicketId"])
            q_id = self._question_ids.get(q_key)
            if q_id is None:
                q_id = self._id()
                self._question_ids[q_key] = q_id
                self.questions.append(
                    (
                        q_id,
                        category.value,
                        ticket["examTicketId"],
                        ticket.get("imageId"),
                        ticket["rightAnswer"],
                    )
                )
                for answer in ticket["answers"]:
                    a_key: AnswerKey = (q_id, answer["answerNumbering"])
                    a_id = self._answer_ids.setdefault(a_key, self._id())
                    self.answers.append((a_id, q_id, answer["answerNumbering"]))
                    self.translations.append(
                        (
                            "answer",
                            a_id,
                            language.value,
                            answer["answer"],
                            None,
                        )
                    )
            self.translations.append(
                (
                    "question",
                    q_id,
                    language.value,
                    ticket["question"],
                    ticket.get("description"),
                )
            )

    def insert_all(self, db_path: Path) -> None:
        if db_path.exists():
            raise FileExistsError(f"{db_path} already exists; refusing to reseed")
        with writer(db_path) as conn:
            conn.executemany("INSERT INTO categories VALUES (?, ?)", self.categories)
            conn.executemany("INSERT INTO languages VALUES (?, ?)", self.languages)
            conn.executemany("INSERT INTO questions VALUES (?, ?, ?, ?, ?)", self.questions)
            conn.executemany("INSERT INTO answers VALUES (?, ?, ?)", self.answers)
            conn.executemany(
                "INSERT OR IGNORE INTO translations VALUES (?, ?, ?, ?, ?, ?)",
                [
                    (None, etype, eid, lid, text, desc)
                    for etype, eid, lid, text, desc in self.translations
                ],
            )


def seed(data_dir: Path, db_path: Path) -> None:
    seeder = Seeder()
    seeder.load_reference()

    files = sorted(data_dir.glob("*-*.json"))
    if not files:
        raise FileNotFoundError(f"no scraped JSON files found in {data_dir}")

    for f in files:
        cat_name, _, lang_code = f.stem.rpartition("-")
        category = ExamCategory[cat_name]
        language = ExamLanguage[lang_code.upper()]
        seeder.load_file(f, category, language)
        logger.info("Loaded %s", f.name)

    logger.info(
        "Inserting %d questions, %d answers, %d translations",
        len(seeder.questions),
        len(seeder.answers),
        len(seeder.translations),
    )
    seeder.insert_all(db_path)
    logger.info("Seeded %s", db_path)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=Path("output"))
    parser.add_argument("--db", type=Path, default=None)
    args = parser.parse_args()
    db_path = args.db or (args.data_dir / DB_FILE_NAME)
    seed(args.data_dir, db_path)


if __name__ == "__main__":
    main()
