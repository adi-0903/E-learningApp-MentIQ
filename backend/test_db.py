import os
import psycopg2
from environs import Env

env = Env()
env.read_env()

db_url = env.str('DATABASE_URL')
print(f"Connecting to: {db_url.split('@')[1]}") # Print host only for security

try:
    conn = psycopg2.connect(db_url)
    print("Connection successful!")
    cur = conn.cursor()
    cur.execute("SELECT version();")
    print(cur.fetchone())
    cur.close()
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
