"""
User Conversation State & Account Registry Manager
"""

import json
import os
from pathlib import Path

DEFAULT_DATA_DIR = Path("/var/www/meta-graph-unofficial/data") if Path("/var/www/meta-graph-unofficial/data").exists() else Path("/home/hokar/Documents/antigravity/silly-galileo")
WORKSPACE_DIR = Path(os.environ.get("METAGRAPH_DATA_DIR", str(DEFAULT_DATA_DIR)))
ACCOUNTS_DB = WORKSPACE_DIR / "accounts_db.json"

class StateManager:
    def __init__(self):
        self.user_states = {} # user_id -> {'step': '...', 'temp_data': {}}
        self.ensure_db()

    def ensure_db(self):
        if not ACCOUNTS_DB.exists():
            default_accounts = [
                {
                    "id": "ig_hokar368",
                    "platform": "instagram",
                    "username": "hokar368",
                    "user_id": "19835089130",
                    "active": True
                },
                {
                    "id": "fb_hokar",
                    "platform": "facebook",
                    "username": "Hokar Veria",
                    "user_id": "61594901048716",
                    "active": True
                }
            ]
            with open(ACCOUNTS_DB, "w", encoding="utf-8") as f:
                json.dump(default_accounts, f, indent=2, ensure_ascii=False)

    def get_accounts(self):
        self.ensure_db()
        with open(ACCOUNTS_DB, "r", encoding="utf-8") as f:
            return json.load(f)

    def get_account_by_id(self, acc_id):
        accounts = self.get_accounts()
        for a in accounts:
            if a["id"] == acc_id:
                return a
        return None

    def add_account(self, acc_data):
        accounts = self.get_accounts()
        accounts.append(acc_data)
        with open(ACCOUNTS_DB, "w", encoding="utf-8") as f:
            json.dump(accounts, f, indent=2, ensure_ascii=False)

    def set_user_state(self, user_id, step, temp_data=None):
        self.user_states[user_id] = {
            "step": step,
            "temp_data": temp_data or {}
        }

    def get_user_state(self, user_id):
        return self.user_states.get(user_id, {"step": "idle", "temp_data": {}})

    def clear_user_state(self, user_id):
        if user_id in self.user_states:
            del self.user_states[user_id]
