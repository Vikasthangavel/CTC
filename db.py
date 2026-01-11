import sqlite3
import os

DB_NAME = 'ctc.db'

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()

    # Admin table
    c.execute('''
        CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    ''')
    
    # Check if admin exists, if not create default
    c.execute('SELECT * FROM admin WHERE username = ?', ('admin',))
    if not c.fetchone():
        # In a real app, use hashed passwords!
        c.execute('INSERT INTO admin (username, password) VALUES (?, ?)', ('admin', 'admin123'))

    # Students table
    c.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            grade INTEGER NOT NULL,
            parent_name TEXT NOT NULL,
            parent_contact TEXT NOT NULL,
            monthly_fee REAL NOT NULL DEFAULT 0
        )
    ''')
    
    # Migration: Add monthly_fee column if it doesn't exist (for existing DBs)
    try:
        c.execute('ALTER TABLE students ADD COLUMN monthly_fee REAL NOT NULL DEFAULT 0')
    except sqlite3.OperationalError:
        pass # Column likely already exists

    # Attendance table
    c.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (student_id) REFERENCES students (id)
        )
    ''')

    # Fees table
    c.execute('''
        CREATE TABLE IF NOT EXISTS fees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            month_year TEXT NOT NULL,
            amount REAL,
            status TEXT NOT NULL DEFAULT 'Unpaid',
            payment_date TEXT,
            FOREIGN KEY (student_id) REFERENCES students (id)
        )
    ''')

    conn.commit()
    conn.close()
    print("Database initialized.")

if __name__ == '__main__':
    init_db()
