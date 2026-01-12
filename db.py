import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

# Database Configuration
DB_CONFIG = {
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'ctc_db'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'connection_timeout': 60 # Increase timeout for remote connections
}

class Row(dict):
    """
    A dict-like object that also supports index access, mimicking sqlite3.Row.
    """
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

class WrappedCursor:
    """
    Wraps a MySQL cursor to behave like a sqlite3 cursor (returning Row objects).
    """
    def __init__(self, cursor, db_conn):
        self.cursor = cursor
        self.db_conn = db_conn

    def fetchone(self):
        row = self.cursor.fetchone()
        if row is None:
            return None
        return Row(self.cursor, row)

    def fetchall(self):
        rows = self.cursor.fetchall()
        return [Row(self.cursor, r) for r in rows]

    def __iter__(self):
        return iter(self.fetchall())
        
    def __getattr__(self, attr):
        return getattr(self.cursor, attr)
        
    @property
    def lastrowid(self):
        return self.cursor.lastrowid

class DBConnection:
    """
    Wraps a MySQL connection to provide a sqlite3-compatible interface:
    - execute() method on connection object
    - returning cursors that yield Row objects
    """
    def __init__(self):
        try:
            self.conn = mysql.connector.connect(**DB_CONFIG)
        except mysql.connector.Error as err:
            # Try to create database if it doesn't exist
            if err.errno == mysql.connector.errorcode.ER_BAD_DB_ERROR:
                temp_config = DB_CONFIG.copy()
                del temp_config['database']
                conn = mysql.connector.connect(**temp_config)
                cursor = conn.cursor()
                cursor.execute(f"CREATE DATABASE {DB_CONFIG['database']}")
                conn.close()
                # Retry
                self.conn = mysql.connector.connect(**DB_CONFIG)
            else:
                raise err

    def execute(self, sql, params=None):
        # Translate '?' to '%s' for MySQL compatibility
        sql = sql.replace('?', '%s')
        
        # Use buffered cursor to avoid 'Unread result found' errors when
        # multiple cursors are used or results aren't fully exhausted.
        cursor = self.conn.cursor(buffered=True)
        try:
            if params:
                cursor.execute(sql, params)
            else:
                cursor.execute(sql)
        except mysql.connector.Error as e:
            # Log or re-raise
            print(f"SQL Error: {e} | Query: {sql}")
            raise e
            
        return WrappedCursor(cursor, self)

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()

def get_db_connection():
    return DBConnection()

def init_db():
    conn = get_db_connection()
    
    # Admin table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS admin (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL
        )
    ''')
    
    # Check if admin exists
    existing = conn.execute('SELECT * FROM admin WHERE username = ?', ('admin',)).fetchone()
    if not existing:
        conn.execute('INSERT INTO admin (username, password) VALUES (?, ?)', ('admin', 'admin123'))

    # Students table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            grade INT NOT NULL,
            parent_name VARCHAR(255) NOT NULL,
            parent_contact VARCHAR(255) NOT NULL,
            monthly_fee FLOAT NOT NULL DEFAULT 0,
            dob VARCHAR(20),
            blood_group VARCHAR(10)
        )
    ''')
    
    # Migration: Add columns if they don't exist
    try:
        conn.execute('SELECT monthly_fee FROM students LIMIT 1')
    except Exception:
        try:
            conn.execute('ALTER TABLE students ADD COLUMN monthly_fee FLOAT NOT NULL DEFAULT 0')
        except Exception as e:
            print(f"Migration warning: {e}")

    try:
        conn.execute('SELECT dob FROM students LIMIT 1')
    except Exception:
        try:
            conn.execute('ALTER TABLE students ADD COLUMN dob VARCHAR(20)')
            conn.execute('ALTER TABLE students ADD COLUMN blood_group VARCHAR(10)')
        except Exception as e:
            print(f"Migration warning (dob/blood_group): {e}")

    # Attendance table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            date VARCHAR(20) NOT NULL,
            status VARCHAR(50) NOT NULL,
            FOREIGN KEY (student_id) REFERENCES students (id)
        )
    ''')

    # Fees table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS fees (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            month_year VARCHAR(20) NOT NULL,
            amount FLOAT,
            status VARCHAR(50) NOT NULL DEFAULT 'Unpaid',
            payment_date VARCHAR(20),
            FOREIGN KEY (student_id) REFERENCES students (id)
        )
    ''')
    
    # Daily Activities table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS daily_activities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            activity_date VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students (id)
        )
    ''')

    # Parent Reports table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS parent_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            message TEXT NOT NULL,
            report_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status VARCHAR(20) NOT NULL DEFAULT 'Unread',
            FOREIGN KEY (student_id) REFERENCES students (id)
        )
    ''')
    
    # Instructions/Announcements table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS instructions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            target_type VARCHAR(20) DEFAULT 'all',
            target_value VARCHAR(50)
        )
    ''')

    # Migration for instructions table
    try:
        conn.execute('SELECT target_type FROM instructions LIMIT 1')
    except Exception:
        try:
            conn.execute("ALTER TABLE instructions ADD COLUMN target_type VARCHAR(20) DEFAULT 'all'")
            conn.execute("ALTER TABLE instructions ADD COLUMN target_value VARCHAR(50)")
        except Exception as e:
            print(f"Migration warning (instructions): {e}")

    conn.commit()
    conn.close()
    print("Database initialized (MySQL).")

if __name__ == '__main__':
    init_db()
