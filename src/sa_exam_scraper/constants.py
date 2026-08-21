"""Exam categories and languages, hardcoded from:
GET /api/v1/DrivingLicenseExamCategories
GET /api/v1/ExamLanguages
"""

from enum import Enum


class ExamCategory(Enum):
    """Driving license exam category. Value is the API CategoryId."""

    A_A1 = 1  # "A,A1"
    B_B1 = 2  # "B,B1"
    C1 = 3  # "C1"
    TS = 4  # "TS"
    C = 5  # "C"
    D1 = 6  # "D1"
    D = 7  # "D"
    TRAM = 8  # "ტრამვაი"
    MILITARY = 9  # "სამხედრო"
    AM = 10  # "AM"


class ExamLanguage(Enum):
    """Exam language. Value is the API LanguageId."""

    KA = 1  # ქართული
    RU = 2  # Русский
    EN = 3  # English
    TR = 4  # Türk
    AZ = 5  # Azərbaycan
    HY = 6  # հայերեն
    OS = 7  # ოსური
    AB = 8  # აფხაზური

    @property
    def slug(self) -> str:
        return self.name.lower()
