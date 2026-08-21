import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS languages (
    id INTEGER PRIMARY KEY,
    code TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    exam_ticket_id INTEGER NOT NULL,
    image_id INTEGER,
    right_answer_numbering INTEGER NOT NULL,
    UNIQUE(category_id, exam_ticket_id)
);

CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES questions(id),
    numbering INTEGER NOT NULL,
    UNIQUE(question_id, numbering)
);

CREATE TABLE IF NOT EXISTS translations (
    id INTEGER PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('question', 'answer')),
    entity_id INTEGER NOT NULL,
    language_id INTEGER NOT NULL REFERENCES languages(id),
    text TEXT NOT NULL,
    description TEXT,
    UNIQUE(entity_type, entity_id, language_id)
);

CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_image ON questions(image_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_translations_entity ON translations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_translations_language ON translations(language_id);
"""


def connect(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def writer(db_path: Path) -> Iterator[sqlite3.Connection]:
    """Connection with the schema applied and a single committing transaction."""
    conn = connect(db_path)
    try:
        conn.executescript(SCHEMA)
        with conn:
            yield conn
    finally:
        conn.close()
