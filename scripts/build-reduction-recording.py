# /// script
# requires-python = ">=3.10,<3.13"
# dependencies = ["playwright==1.58.0", "numpy", "soundfile"]
# ///
# Copyright © 2026 Christopher Snow.
"""Keep the original Chapter 9 export command available."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name("build-recording.py")),run_name="__main__")
