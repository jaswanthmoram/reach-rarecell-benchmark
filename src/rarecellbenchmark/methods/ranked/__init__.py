"""REACH - Ranked method wrappers."""

from rarecellbenchmark.methods.ranked.fire import FiREWrapper
from rarecellbenchmark.methods.ranked.deepscena import DeepScenaWrapper
from rarecellbenchmark.methods.ranked.rareq import RareQWrapper
from rarecellbenchmark.methods.ranked.cellsius import CellSIUSWrapper
from rarecellbenchmark.methods.ranked.sccad import ScCADWrapper
from rarecellbenchmark.methods.ranked.scmalignantfinder import ScMalignantFinderWrapper

__all__ = [
    "FiREWrapper",
    "DeepScenaWrapper",
    "RareQWrapper",
    "CellSIUSWrapper",
    "ScCADWrapper",
    "ScMalignantFinderWrapper",
]
