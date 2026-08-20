from dotenv import load_dotenv
import os

load_dotenv("backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")