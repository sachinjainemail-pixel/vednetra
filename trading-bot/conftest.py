"""Ensure the project root is importable as `bot` during tests."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
