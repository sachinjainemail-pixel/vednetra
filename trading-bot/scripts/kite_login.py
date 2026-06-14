#!/usr/bin/env python3
"""Generate a daily Zerodha Kite Connect access token.

Kite access tokens expire every day, so you run this once each morning before
starting the bot in live/kite mode.

Usage:
    1. Put KITE_API_KEY and KITE_API_SECRET in your .env file.
    2. Run:  python scripts/kite_login.py
    3. Open the printed login URL, log in, and copy the `request_token` from
       the redirected URL.
    4. Paste it back here. The new access token is written to .env.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

try:
    from dotenv import load_dotenv, set_key
except ImportError:
    raise SystemExit("pip install python-dotenv")

try:
    from kiteconnect import KiteConnect
except ImportError:
    raise SystemExit("pip install kiteconnect")


def main() -> int:
    env_path = ROOT / ".env"
    load_dotenv(env_path)
    api_key = os.getenv("KITE_API_KEY")
    api_secret = os.getenv("KITE_API_SECRET")
    if not api_key or not api_secret:
        raise SystemExit("Set KITE_API_KEY and KITE_API_SECRET in .env first.")

    kite = KiteConnect(api_key=api_key)
    print("\n1) Open this URL and log in:\n")
    print("   " + kite.login_url() + "\n")
    print("2) After login you are redirected to your app's redirect URL with")
    print("   ?request_token=XXXX in it. Copy that token.\n")
    request_token = input("Paste request_token here: ").strip()

    data = kite.generate_session(request_token, api_secret=api_secret)
    access_token = data["access_token"]

    if not env_path.exists():
        env_path.write_text("")
    set_key(str(env_path), "KITE_ACCESS_TOKEN", access_token)
    print(f"\nAccess token saved to {env_path}. You can now run: python run.py --feed kite")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
