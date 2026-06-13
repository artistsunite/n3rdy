"""Apply advisor chat migration SQL to Neon PostgreSQL database."""
import os
import psycopg2

def load_env(path):
    env = {}
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, _, v = line.partition('=')
                    env[k.strip()] = v.strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return env

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env = load_env(os.path.join(root, '.env.local'))
db_url = env.get('DATABASE_URL') or os.environ.get('DATABASE_URL')

if not db_url:
    raise SystemExit('DATABASE_URL not found in .env.local or environment')

migration_path = os.path.join(
    root, 'prisma', 'migrations',
    '20260614000003_advisor_chat', 'migration.sql'
)

with open(migration_path) as f:
    sql = f.read()

conn = psycopg2.connect(db_url)
cur = conn.cursor()

try:
    cur.execute(sql)
    conn.commit()
    print('Advisor chat migration applied successfully.')
except Exception as e:
    conn.rollback()
    print(f'Error: {e}')
    raise
finally:
    conn.close()
