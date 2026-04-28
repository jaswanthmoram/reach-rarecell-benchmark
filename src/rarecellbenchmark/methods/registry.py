from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from rarecellbenchmark.methods.base import BaseMethodWrapper

METHOD_REGISTRY: dict[str, type[BaseMethodWrapper]] = {}


def register(wrapper_cls: type[BaseMethodWrapper]) -> type[BaseMethodWrapper]:
    """Decorator to register a method wrapper class."""
    METHOD_REGISTRY[wrapper_cls.method_id] = wrapper_cls
    return wrapper_cls


def get_method(method_id: str) -> type[BaseMethodWrapper]:
    """Look up a registered method by ID."""
    if method_id not in METHOD_REGISTRY:
        raise KeyError(
            f"Method '{method_id}' not found in registry. "
            f"Available: {list_methods()}"
        )
    return METHOD_REGISTRY[method_id]


def list_methods(category: str | None = None) -> list[str]:
    """List registered method IDs, optionally filtered by category."""
    methods = list(METHOD_REGISTRY.keys())
    if category is None:
        return methods
    return [
        m for m in methods
        if getattr(METHOD_REGISTRY[m], "category", None) == category
    ]


# Auto-import and register all built-in methods at module load time.
from rarecellbenchmark.methods.naive.random_baseline import RandomBaselineWrapper  # noqa: E402
from rarecellbenchmark.methods.naive.expr_threshold import ExprThresholdWrapper  # noqa: E402
from rarecellbenchmark.methods.naive.hvg_logreg import HVGLogRegWrapper  # noqa: E402

register(RandomBaselineWrapper)
register(ExprThresholdWrapper)
register(HVGLogRegWrapper)
