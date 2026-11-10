"""Compatibility shim for PyAV and faster-whisper.

PyAV v15+ (and v19+) removed the `metadata_errors` keyword argument from `av.open()`,
which causes `TypeError: open() got an unexpected keyword argument 'metadata_errors'`
when called by faster-whisper 1.2.x.

This module patches `av.open` to safely discard `metadata_errors` if present.
"""

import av

_orig_av_open = av.open


def _safe_av_open(file, *args, **kwargs):
    kwargs.pop("metadata_errors", None)
    return _orig_av_open(file, *args, **kwargs)


# Apply patch
av.open = _safe_av_open
