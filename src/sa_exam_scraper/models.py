from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class Answer:
    answer: str
    answer_numbering: int

    @classmethod
    def from_api(cls, data: dict[str, Any]) -> "Answer":
        return cls(answer=data["answer"], answer_numbering=data["answerNumbering"])

    def to_dict(self) -> dict[str, Any]:
        return {"answer": self.answer, "answerNumbering": self.answer_numbering}


@dataclass
class Ticket:
    id: int
    exam_ticket_id: int
    image_id: int | None
    question: str
    answers: list[Answer] = field(default_factory=list)
    right_answer: int = 0
    description: str | None = None

    @classmethod
    def from_api(cls, data: dict[str, Any]) -> "Ticket":
        return cls(
            id=data["id"],
            exam_ticket_id=data["examTicketId"],
            image_id=data.get("imageId"),
            question=data["question"],
            answers=[Answer.from_api(a) for a in data["answers"]],
            right_answer=data["rightAnswer"],
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "examTicketId": self.exam_ticket_id,
            "imageId": self.image_id,
            "question": self.question,
            "answers": [a.to_dict() for a in self.answers],
            "rightAnswer": self.right_answer,
            "description": self.description,
        }
