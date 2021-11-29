"""
A docstring
"""

from typing import Any, List, Literal, Optional, TypedDict

from superset.utils.core import FilterOperator


class BusinessTypeResponse(TypedDict, total=False):
    """
    A docstring
    """

    status: Literal["valid", "invalid"]
    value: Any  # parsed value (can be any value)
    formatted_value: Optional[str]  # a string representation of the parsed value
    valid_filter_operators: List[FilterOperator]
