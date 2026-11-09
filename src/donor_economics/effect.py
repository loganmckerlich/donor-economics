"""How donated dollars turn into win probability. Shared by both strategies.

``p(D) = p0 + lift(D / s)`` capped just below 1, where the lift is one of:
    log:        k * ln(1 + x)
    linear:     k * x
    saturating: k * (1 - exp(-x))
"""

from __future__ import annotations

import numpy as np

P_CAP = 0.999  # keep prices strictly inside (0, 1)


def win_prob(donation, *, base: float, size: float, scale: float, form: str):
    """P(A wins) given donation(s). Accepts a float or a numpy array."""
    x = np.asarray(donation, dtype=float) / scale
    if form == "log":
        lift = size * np.log1p(x)
    elif form == "linear":
        lift = size * x
    elif form == "saturating":
        lift = size * (1 - np.exp(-x))
    else:
        raise ValueError(f"unknown effect_form {form!r}")
    out = np.minimum(base + lift, P_CAP)
    return float(out) if out.ndim == 0 else out
