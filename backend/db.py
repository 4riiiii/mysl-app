"""MongoDB connection and helpers."""
import os
from motor.motor_asyncio import AsyncIOMotorClient

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Collections
users = db.users
sessions_col = db.user_sessions
focus_sessions = db.focus_sessions
tasks_col = db.tasks
notes_col = db.notes
transcripts = db.transcripts
companion_messages = db.companion_messages
