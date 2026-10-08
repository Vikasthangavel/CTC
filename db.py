import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

# ──────────────────────────────────────────
#  Database Configuration
# ──────────────────────────────────────────
DB_CONFIG = {
    'user':     os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'host':     os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'classpulse_db'),
    'port':     int(os.getenv('DB_PORT', 3306)),
    'connection_timeout': 60
}


# ──────────────────────────────────────────
#  Row Helper — makes MySQL rows behave like dicts
# ──────────────────────────────────────────
class Row(dict):
    """Allows both row['column'] and row[0] access, like sqlite3.Row."""
    def __init__(self, cursor, row_tuple):
        self.row_tuple = row_tuple
        super().__init__()
        if cursor.description:
            for i, col in enumerate(cursor.description):
                self[col[0]] = row_tuple[i]

    def __getitem__(self, key):
        if isinstance(key, int):
            return self.row_tuple[key]
        return super().__getitem__(key)


# ──────────────────────────────────────────
#  Cursor Wrapper — returns Row objects
# ──────────────────────────────────────────
class WrappedCursor:
    def __init__(self, cursor):
        self.cursor = cursor

    def fetchone(self):
        row = self.cursor.fetchone()
        return Row(self.cursor, row) if row else None

    def fetchall(self):
        return [Row(self.cursor, r) for r in self.cursor.fetchall()]

    def __iter__(self):
        return iter(self.fetchall())

    def __getattr__(self, attr):
        return getattr(self.cursor, attr)

    @property
    def lastrowid(self):
        return self.cursor.lastrowid


# ──────────────────────────────────────────
#  Connection Wrapper — sqlite3-like interface
# ──────────────────────────────────────────
class DBConnection:
    def __init__(self):
        try:
            self.conn = mysql.connector.connect(**DB_CONFIG)
        except mysql.connector.Error as err:
            # Auto-create the database if it doesn't exist yet
            if err.errno == mysql.connector.errorcode.ER_BAD_DB_ERROR:
                config_no_db = {k: v for k, v in DB_CONFIG.items() if k != 'database'}
                temp = mysql.connector.connect(**config_no_db)
                temp.cursor().execute(f"CREATE DATABASE {DB_CONFIG['database']}")
                temp.close()
                self.conn = mysql.connector.connect(**DB_CONFIG)
            else:
                raise

    def execute(self, sql, params=None):
        # MySQL uses %s instead of ? for placeholders
        sql = sql.replace('?', '%s')
        cursor = self.conn.cursor(buffered=True)
        try:
            cursor.execute(sql, params) if params else cursor.execute(sql)
        except mysql.connector.Error as e:
            print(f"SQL Error: {e}\nQuery: {sql}")
            raise
        return WrappedCursor(cursor)

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()


def get_db_connection():
    return DBConnection()


# ──────────────────────────────────────────
#  Database Initialization — Creates all tables
# ──────────────────────────────────────────
def init_db():
    conn = get_db_connection()

    # ── Tuitions ──────────────────────────
    # Each tuition center is a separate account on ClassPulse
    conn.execute('''
        CREATE TABLE IF NOT EXISTS tuitions (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            name        VARCHAR(255) NOT NULL,
            phone       VARCHAR(20)  NOT NULL UNIQUE,
            email       VARCHAR(255),
            password    VARCHAR(255) NOT NULL,
            address     TEXT,
            logo_url    TEXT,
            is_active   TINYINT DEFAULT 1,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # ── Sub-admins ────────────────────────
    # Staff members for each tuition (e.g., teachers)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS sub_admins (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            tuition_id  INT NOT NULL,
            name        VARCHAR(255) NOT NULL,
            phone       VARCHAR(20)  NOT NULL,
            password    VARCHAR(255) NOT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tuition_id) REFERENCES tuitions(id)
        )
    ''')

    # ── Students ──────────────────────────
    conn.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            tuition_id      INT NOT NULL,
            name            VARCHAR(255) NOT NULL,
            grade           INT NOT NULL,
            parent_name     VARCHAR(255) NOT NULL,
            parent_contact  VARCHAR(20)  NOT NULL,
            monthly_fee     FLOAT NOT NULL DEFAULT 0,
            dob             VARCHAR(20),
            blood_group     VARCHAR(10),
            is_active       TINYINT DEFAULT 1,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tuition_id) REFERENCES tuitions(id)
        )
    ''')

    # ── Attendance ────────────────────────
    conn.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            tuition_id  INT NOT NULL,
            student_id  INT NOT NULL,
            date        VARCHAR(20) NOT NULL,
            session     VARCHAR(20) DEFAULT 'Evening',
            status      VARCHAR(20) NOT NULL,
            FOREIGN KEY (tuition_id) REFERENCES tuitions(id),
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    ''')

    # ── Fees ──────────────────────────────
    conn.execute('''
        CREATE TABLE IF NOT EXISTS fees (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            tuition_id      INT NOT NULL,
            student_id      INT NOT NULL,
            month_year      VARCHAR(20) NOT NULL,
            amount          FLOAT,
            status          VARCHAR(20) NOT NULL DEFAULT 'Unpaid',
            payment_date    VARCHAR(20),
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tuition_id) REFERENCES tuitions(id),
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    ''')

    # ── Daily Activities ──────────────────
    conn.execute('''
        CREATE TABLE IF NOT EXISTS daily_activities (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            tuition_id      INT NOT NULL,
            student_id      INT NOT NULL,
            activity_date   VARCHAR(20) NOT NULL,
            content         TEXT NOT NULL,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tuition_id) REFERENCES tuitions(id),
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    ''')

    # ── Parent Reports ────────────────────
    # Messages sent from parents to the tuition admin
    conn.execute('''
        CREATE TABLE IF NOT EXISTS parent_reports (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            tuition_id  INT NOT NULL,
            student_id  INT NOT NULL,
            message     TEXT NOT NULL,
            status      VARCHAR(20) DEFAULT 'Unread',
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tuition_id) REFERENCES tuitions(id),
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    ''')

    # ── Announcements ─────────────────────
    # Instructions/notices sent from admin to parents
    conn.execute('''
        CREATE TABLE IF NOT EXISTS announcements (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            tuition_id      INT NOT NULL,
            message         TEXT NOT NULL,
            target_type     VARCHAR(20) DEFAULT 'all',
            target_value    VARCHAR(50),
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tuition_id) REFERENCES tuitions(id)
        )
    ''')

    conn.commit()
    conn.close()
    print("ClassPulse database initialized successfully.")


if __name__ == '__main__':
    init_db()
