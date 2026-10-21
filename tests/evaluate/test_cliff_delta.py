import numpy as np
import pytest
from rarecellbenchmark.evaluate.statistics import cliff_delta

def test_cliff_delta_dominating():
    a = np.array([10, 11, 12])
    b = np.array([1, 2, 3])
    # all a > b -> delta = 1.0
    assert cliff_delta(a, b) == 1.0
    # all b < a -> delta = -1.0
    assert cliff_delta(b, a) == -1.0

def test_cliff_delta_identical():
    a = np.array([1, 2, 3])
    b = np.array([1, 2, 3])
    # identical -> delta = 0.0
    assert cliff_delta(a, b) == 0.0

def test_cliff_delta_mixed():
    a = np.array([1, 5, 6])
    b = np.array([2, 3, 7])
    # comparisons:
    # a[0]=1 vs b=[2, 3, 7] -> signs: -1, -1, -1
    # a[1]=5 vs b=[2, 3, 7] -> signs: 1, 1, -1
    # a[2]=6 vs b=[2, 3, 7] -> signs: 1, 1, -1
    # sum of signs: (-3) + (1) + (1) = -1
    # n*m = 9
    # delta = -1 / 9
    assert pytest.approx(cliff_delta(a, b)) == -1.0 / 9.0
