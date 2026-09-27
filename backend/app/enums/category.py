from enum import Enum


class Category(str, Enum):
    """Fixed set of expense categories per requirements.

    Inheriting from (str, Enum) lets Pydantic accept/return plain strings,
    but we override __str__ so that str(member) returns the lowercase VALUE
    ("food") rather than the Python NAME ("FOOD"). Without this, psycopg2
    sends the uppercase name to Postgres, which rejects it against the
    category_enum type (which stores lowercase values).
    """

    FOOD = "food"
    TRANSPORT = "transport"
    BILLS = "bills"
    ENTERTAINMENT = "entertainment"
    OTHER = "other"

    def __str__(self) -> str:
        return self.value
