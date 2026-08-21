# sa-exam-scraper

Scraper for the Georgian driving license exam tickets served by
[api-my.sa.gov.ge](https://api-my.sa.gov.ge). Downloads every ticket (question,
answers, correct answer, official explanation) for all exam categories and
languages, plus the road-sign images, and can seed everything into a SQLite
database.

## Features

- All 10 categories x 8 languages (~67k tickets) via async `aiohttp`
  with bounded concurrency and retries
- Images deduplicated by `imageId` into a single `images/` folder
- SQLite schema separating language-invariant facts from per-language text
- Idempotent backfill commands for descriptions and images that the flaky API
  dropped mid-scrape

## Setup

Requires [uv](https://docs.astral.sh/uv/).

```bash
uv sync
```

## Usage

```bash
# Scrape everything into ./output
uv run sa-exam-scraper

# Scrape a subset
uv run sa-exam-scraper -c B_B1 -l KA,EN -o output

# Fill in descriptions/images that failed (safe to rerun)
uv run sa-exam-backfill output
uv run sa-exam-image-backfill output

# Seed the SQLite DB from scraped JSON (creates output/exam_tickets.db)
uv run sa-exam-seed
```

## Output layout

```
output/
├── images/<imageId>.jpg        # one image per unique imageId
├── <CATEGORY>-<language>.json  # e.g. B_B1-en.json
└── exam_tickets.db             # after running sa-exam-seed
```

Each JSON file contains tickets exactly as returned by the API plus a
`description` field with the official explanation (plain text, may be `null`).

## Database schema

`examTicketId` is shared across languages: it identifies the question concept,
while text and descriptions are per-language. The same ticket id may appear in
more than one category. Georgian (`ka`) is the authoritative language; other
languages may lag behind and contain extra or outdated ticket ids.

```
categories(id, slug)
languages(id, code)
questions(id, category_id -> categories, exam_ticket_id,
          image_id, right_answer_numbering)   UNIQUE(category_id, exam_ticket_id)
answers(id, question_id -> questions, numbering)   UNIQUE(question_id, numbering)
translations(id, entity_type 'question'|'answer', entity_id,
             language_id -> languages, text, description)   
             UNIQUE(entity_type, entity_id, language_id)
```

Example - all B-category questions in Georgian with their explanations:

```sql
SELECT t.text AS question, t.description, q.image_id, q.right_answer_numbering
FROM questions q
JOIN categories c ON c.id = q.category_id
JOIN translations t ON t.entity_type = 'question'
                   AND t.entity_id = q.id AND t.language_id = 1
WHERE c.slug = 'B_B1';
```

## Project layout

```
src/sa_exam_scraper/
├── constants.py       # ExamCategory / ExamLanguage enums (API ids hardcoded)
├── models.py          # Ticket / Answer dataclasses
├── client.py          # aiohttp API client + retry helper
├── scraper.py         # orchestration: tickets -> descriptions + images
├── backfill.py        # refetch missing descriptions
├── image_backfill.py  # refetch missing images
├── seeder.py          # JSON -> SQLite
├── db.py              # schema + connection helpers
└── main.py            # CLI entrypoint
```

## License

[MIT](LICENSE)
