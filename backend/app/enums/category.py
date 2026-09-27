from enum import Enum


class Category(str, Enum):
    """Fixed set of expense categories per requirements."""
    FOOD = "food"
    TRANSPORT = "transport"
    BILLS = "bills"
    ENTERTAINMENT = "entertainment"
    OTHER = "other"
