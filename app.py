from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token,
    jwt_required, get_jwt_identity
)
from datetime import datetime, timedelta
import json
from db import init_db, get_db_connection

# ──────────────────────────────────────────
#  Patch: Allow non-string JWT subjects
#  PyJWT 2.x enforces sub must be a string.
#  We disable that check so both old (dict)
#  and new (string) tokens work seamlessly.
# ──────────────────────────────────────────
import jwt.api_jwt
jwt.api_jwt.PyJWT._validate_sub = lambda self, payload, subject=None: None

# ──────────────────────────────────────────
#  App Setup
# ──────────────────────────────────────────
app = Flask(__name__)

@app.before_request
def log_request_info():
    auth_header = request.headers.get('Authorization')
    if auth_header:
        print(f"[{request.method} {request.path}] Authorization Header: '{auth_header}'")

app.config['JWT_SECRET_KEY'] = 'classpulse-secret-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=12)

CORS(app)
jwt = JWTManager(app)

# Initialize database on startup
init_db()


# ──────────────────────────────────────────
#  Helper Functions
# ──────────────────────────────────────────
def success(data=None, message='Success', status=200):
    """Standard success response."""
    return jsonify({'success': True, 'message': message, 'data': data}), status

def error(message='Error', status=400):
    """Standard error response."""
    return jsonify({'success': False, 'message': message}), status

def _parse_identity():
    """Parse JWT identity — handles both old dict tokens and new string tokens."""
    raw = get_jwt_identity()
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            return {}
    return {}

def get_tuition_id():
    """Get the tuition_id from the JWT identity."""
    return _parse_identity().get('tuition_id')

def get_identity_type():
    """Get the user type from JWT (tuition_admin or parent)."""
    return _parse_identity().get('type')


# ══════════════════════════════════════════
#  AUTH ROUTES
# ══════════════════════════════════════════

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """Register a new tuition center on ClassPulse."""
    data = request.get_json(silent=True, force=True) or {}
    print("INCOMING SIGNUP DATA:", data)
    print("RAW REQUEST DATA:", request.data)

    name    = data.get('name', '').strip()
    phone   = data.get('phone', '').strip()
    email   = data.get('email', '').strip()
    password = data.get('password', '').strip()
    address = data.get('address', '').strip()

    if not name or not phone or not password:
        print(f"Validation failed. name='{name}', phone='{phone}', password='{password}'")
        return error('Name, phone, and password are required.')

    conn = get_db_connection()

    # Check if phone is already registered
    existing = conn.execute('SELECT id FROM tuitions WHERE phone = ?', (phone,)).fetchone()
    if existing:
        conn.close()
        return error('This phone number is already registered.')

    conn.execute(
        'INSERT INTO tuitions (name, phone, email, password, address) VALUES (?, ?, ?, ?, ?)',
        (name, phone, email, password, address)
    )
    conn.commit()

    tuition = conn.execute('SELECT * FROM tuitions WHERE phone = ?', (phone,)).fetchone()
    conn.close()

    # Create JWT token for the new tuition
    identity_str = json.dumps({'tuition_id': tuition['id'], 'type': 'tuition_admin'})
    token = create_access_token(identity=identity_str)

    return success({
        'token': token,
        'tuition': {
            'id': tuition['id'],
            'name': tuition['name'],
            'phone': tuition['phone'],
            'email': tuition['email'],
            'address': tuition['address']
        }
    }, 'Tuition registered successfully!', 201)


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login for tuition admin."""
    data = request.get_json(silent=True, force=True) or {}

    phone    = data.get('phone', '').strip()
    password = data.get('password', '').strip()

    if not phone or not password:
        return error('Phone and password are required.')

    conn = get_db_connection()
    tuition = conn.execute(
        'SELECT * FROM tuitions WHERE phone = ? AND password = ? AND is_active = 1',
        (phone, password)
    ).fetchone()
    conn.close()

    if not tuition:
        return error('Invalid phone or password.', 401)

    identity_str = json.dumps({'tuition_id': tuition['id'], 'type': 'tuition_admin'})
    token = create_access_token(identity=identity_str)

    return success({
        'token': token,
        'tuition': {
            'id': tuition['id'],
            'name': tuition['name'],
            'phone': tuition['phone'],
            'email': tuition['email'],
            'address': tuition['address']
        }
    }, 'Logged in successfully!')


@app.route('/api/auth/parent-login', methods=['POST'])
def parent_login():
    """Login for parents using their phone number."""
    data = request.get_json(silent=True, force=True) or {}

    phone      = data.get('phone', '').strip()
    tuition_id = data.get('tuition_id')

    if not phone or not tuition_id:
        return error('Phone and tuition ID are required.')

    conn = get_db_connection()
    students = conn.execute(
        'SELECT * FROM students WHERE tuition_id = ? AND parent_contact = ? AND is_active = 1',
        (tuition_id, phone)
    ).fetchall()
    conn.close()

    if not students:
        return error('Phone number not registered with any student in this tuition.', 401)

    identity_str = json.dumps({
        'tuition_id': tuition_id,
        'parent_phone': phone,
        'type': 'parent'
    })
    token = create_access_token(identity=identity_str)

    return success({
        'token': token,
        'students': [{'id': s['id'], 'name': s['name'], 'grade': s['grade']} for s in students]
    }, 'Logged in successfully!')


@app.route('/api/auth/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current logged-in tuition profile."""
    tuition_id = get_tuition_id()
    conn = get_db_connection()
    tuition = conn.execute('SELECT * FROM tuitions WHERE id = ?', (tuition_id,)).fetchone()
    conn.close()

    if not tuition:
        return error('Tuition not found.', 404)

    return success({
        'id': tuition['id'],
        'name': tuition['name'],
        'phone': tuition['phone'],
        'email': tuition['email'],
        'address': tuition['address'],
        'logo_url': tuition['logo_url']
    })


# ══════════════════════════════════════════
#  STUDENTS ROUTES
# ══════════════════════════════════════════

@app.route('/api/students', methods=['GET'])
@jwt_required()
def get_students():
    """Get all students for this tuition."""
    tuition_id  = get_tuition_id()
    show_inactive = request.args.get('show_inactive', 'false') == 'true'

    conn = get_db_connection()
    if show_inactive:
        students = conn.execute(
            'SELECT * FROM students WHERE tuition_id = ? ORDER BY grade, name',
            (tuition_id,)
        ).fetchall()
    else:
        students = conn.execute(
            'SELECT * FROM students WHERE tuition_id = ? AND is_active = 1 ORDER BY grade, name',
            (tuition_id,)
        ).fetchall()
    conn.close()

    return success([dict(s) for s in students])


@app.route('/api/students', methods=['POST'])
@jwt_required()
def add_student():
    """Add a new student to this tuition."""
    tuition_id = get_tuition_id()
    data = request.get_json(silent=True, force=True) or {}

    name           = data.get('name', '').strip()
    grade          = data.get('grade')
    parent_name    = data.get('parent_name', '').strip()
    parent_contact = data.get('parent_contact', '').strip()
    monthly_fee    = data.get('monthly_fee', 0)
    dob            = data.get('dob', '')
    blood_group    = data.get('blood_group', '')

    if not name or not grade or not parent_name or not parent_contact:
        return error('Name, grade, parent name, and contact are required.')

    conn = get_db_connection()
    conn.execute(
        '''INSERT INTO students
           (tuition_id, name, grade, parent_name, parent_contact, monthly_fee, dob, blood_group)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
        (tuition_id, name, grade, parent_name, parent_contact, monthly_fee, dob, blood_group)
    )
    conn.commit()

    student_id = conn.execute('SELECT LAST_INSERT_ID() as id').fetchone()['id']
    student = conn.execute('SELECT * FROM students WHERE id = ?', (student_id,)).fetchone()
    conn.close()

    return success(dict(student), 'Student added successfully!', 201)


@app.route('/api/students/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student(student_id):
    """Get a single student by ID."""
    tuition_id = get_tuition_id()
    conn = get_db_connection()
    student = conn.execute(
        'SELECT * FROM students WHERE id = ? AND tuition_id = ?',
        (student_id, tuition_id)
    ).fetchone()
    conn.close()

    if not student:
        return error('Student not found.', 404)

    return success(dict(student))


@app.route('/api/students/<int:student_id>', methods=['PUT'])
@jwt_required()
def update_student(student_id):
    """Update student details."""
    tuition_id = get_tuition_id()
    data = request.get_json(silent=True, force=True) or {}

    conn = get_db_connection()
    conn.execute(
        '''UPDATE students SET
           name = ?, grade = ?, parent_name = ?, parent_contact = ?,
           monthly_fee = ?, dob = ?, blood_group = ?, is_active = ?
           WHERE id = ? AND tuition_id = ?''',
        (
            data.get('name'),
            data.get('grade'),
            data.get('parent_name'),
            data.get('parent_contact'),
            data.get('monthly_fee', 0),
            data.get('dob', ''),
            data.get('blood_group', ''),
            1 if data.get('is_active', True) else 0,
            student_id,
            tuition_id
        )
    )
    conn.commit()
    conn.close()

    return success(message='Student updated successfully!')


@app.route('/api/students/<int:student_id>', methods=['DELETE'])
@jwt_required()
def delete_student(student_id):
    """Delete a student (only if inactive)."""
    tuition_id = get_tuition_id()
    conn = get_db_connection()

    student = conn.execute(
        'SELECT is_active FROM students WHERE id = ? AND tuition_id = ?',
        (student_id, tuition_id)
    ).fetchone()

    if not student:
        conn.close()
        return error('Student not found.', 404)

    if student['is_active'] == 1:
        conn.close()
        return error('Deactivate the student before deleting.')

    conn.execute('DELETE FROM students WHERE id = ? AND tuition_id = ?', (student_id, tuition_id))
    conn.commit()
    conn.close()

    return success(message='Student deleted successfully!')


@app.route('/api/students/<int:student_id>/toggle-active', methods=['POST'])
@jwt_required()
def toggle_student_active(student_id):
    """Toggle student active/inactive status."""
    tuition_id = get_tuition_id()
    conn = get_db_connection()

    student = conn.execute(
        'SELECT is_active FROM students WHERE id = ? AND tuition_id = ?',
        (student_id, tuition_id)
    ).fetchone()

    if not student:
        conn.close()
        return error('Student not found.', 404)

    new_status = 0 if student['is_active'] == 1 else 1
    conn.execute(
        'UPDATE students SET is_active = ? WHERE id = ? AND tuition_id = ?',
        (new_status, student_id, tuition_id)
    )
    conn.commit()
    conn.close()

    status_text = 'activated' if new_status == 1 else 'deactivated'
    return success(message=f'Student {status_text} successfully!')


# ══════════════════════════════════════════
#  ATTENDANCE ROUTES
# ══════════════════════════════════════════

@app.route('/api/attendance', methods=['GET'])
@jwt_required()
def get_attendance():
    """Get attendance for a specific date (and optionally session)."""
    tuition_id = get_tuition_id()
    date    = request.args.get('date')
    session = request.args.get('session', 'Evening')

    if not date:
        return error('Date is required.')

    conn = get_db_connection()
    records = conn.execute(
        'SELECT * FROM attendance WHERE tuition_id = ? AND date = ? AND session = ?',
        (tuition_id, date, session)
    ).fetchall()
    conn.close()

    # Return as a map: student_id -> status
    attendance_map = {str(r['student_id']): r['status'] for r in records}
    return success(attendance_map)


@app.route('/api/attendance/bulk', methods=['POST'])
@jwt_required()
def save_bulk_attendance():
    """Save attendance for multiple students at once."""
    tuition_id = get_tuition_id()
    data = request.get_json(silent=True, force=True) or {}

    date       = data.get('date')
    session    = data.get('session', 'Evening')
    status_map = data.get('status_map', {})  # { "student_id": "Present/Absent" }

    if not date or not status_map:
        return error('Date and status_map are required.')

    conn = get_db_connection()

    for student_id, status in status_map.items():
        existing = conn.execute(
            'SELECT id FROM attendance WHERE tuition_id = ? AND student_id = ? AND date = ? AND session = ?',
            (tuition_id, student_id, date, session)
        ).fetchone()

        if existing:
            conn.execute(
                'UPDATE attendance SET status = ? WHERE id = ?',
                (status, existing['id'])
            )
        else:
            conn.execute(
                'INSERT INTO attendance (tuition_id, student_id, date, session, status) VALUES (?, ?, ?, ?, ?)',
                (tuition_id, student_id, date, session, status)
            )

    conn.commit()
    conn.close()

    return success(message='Attendance saved successfully!')


@app.route('/api/attendance/monthly-stats', methods=['GET'])
@jwt_required()
def get_monthly_attendance_stats():
    """Get per-student attendance stats for a given month."""
    tuition_id     = get_tuition_id()
    month = request.args.get('month', datetime.now().strftime('%Y-%m'))

    conn = get_db_connection()
    stats = conn.execute(
        '''SELECT s.id, s.name, s.grade,
               COUNT(a.id) as total_marked,
               SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count
           FROM students s
           LEFT JOIN attendance a
               ON s.id = a.student_id
               AND a.tuition_id = ?
               AND LEFT(a.date, 7) = ?
           WHERE s.tuition_id = ? AND s.is_active = 1
           GROUP BY s.id, s.name, s.grade
           ORDER BY s.grade, s.name''',
        (tuition_id, month, tuition_id)
    ).fetchall()
    conn.close()

    result = []
    for row in stats:
        total   = row['total_marked'] or 0
        present = row['present_count'] or 0
        pct     = round((present / total * 100), 1) if total > 0 else 0
        result.append({
            'student_id': row['id'],
            'name':       row['name'],
            'grade':      row['grade'],
            'total':      total,
            'present':    present,
            'percentage': pct
        })

    return success(result)


# ══════════════════════════════════════════
#  DAILY ACTIVITIES ROUTES
# ══════════════════════════════════════════

@app.route('/api/activities', methods=['POST'])
@jwt_required()
def add_activity():
    """Log a daily activity for a student."""
    tuition_id = get_tuition_id()
    data = request.get_json(silent=True, force=True) or {}

    student_id    = data.get('student_id')
    content       = data.get('content', '').strip()
    activity_date = data.get('activity_date', datetime.now().strftime('%Y-%m-%d'))

    if not student_id or not content:
        return error('Student ID and content are required.')

    conn = get_db_connection()
    conn.execute(
        'INSERT INTO daily_activities (tuition_id, student_id, activity_date, content) VALUES (?, ?, ?, ?)',
        (tuition_id, student_id, activity_date, content)
    )
    conn.commit()
    conn.close()

    return success(message='Activity logged successfully!', status=201)


@app.route('/api/activities/<int:student_id>', methods=['GET'])
@jwt_required()
def get_activities(student_id):
    """Get activities for a student filtered by month."""
    tuition_id = get_tuition_id()
    month = request.args.get('month', datetime.now().strftime('%Y-%m'))

    conn = get_db_connection()
    activities = conn.execute(
        '''SELECT * FROM daily_activities
           WHERE tuition_id = ? AND student_id = ? AND LEFT(activity_date, 7) = ?
           ORDER BY activity_date DESC, created_at DESC''',
        (tuition_id, student_id, month)
    ).fetchall()
    conn.close()

    return success([dict(a) for a in activities])


@app.route('/api/activities/<int:activity_id>', methods=['DELETE'])
@jwt_required()
def delete_activity(activity_id):
    """Delete a daily activity."""
    tuition_id = get_tuition_id()
    conn = get_db_connection()

    activity = conn.execute(
        'SELECT * FROM daily_activities WHERE id = ? AND tuition_id = ?',
        (activity_id, tuition_id)
    ).fetchone()

    if not activity:
        conn.close()
        return error('Activity not found.', 404)

    conn.execute('DELETE FROM daily_activities WHERE id = ?', (activity_id,))
    conn.commit()
    conn.close()

    return success(message='Activity deleted successfully!')


# ══════════════════════════════════════════
#  FEES ROUTES
# ══════════════════════════════════════════

@app.route('/api/fees', methods=['GET'])
@jwt_required()
def get_fees():
    """Get fee status for all active students in a given month."""
    tuition_id = get_tuition_id()
    month = request.args.get('month', datetime.now().strftime('%Y-%m'))

    conn = get_db_connection()
    students = conn.execute(
        'SELECT * FROM students WHERE tuition_id = ? AND is_active = 1 ORDER BY grade, name',
        (tuition_id,)
    ).fetchall()

    fees = conn.execute(
        'SELECT * FROM fees WHERE tuition_id = ? AND month_year = ?',
        (tuition_id, month)
    ).fetchall()
    conn.close()

    fee_map = {f['student_id']: f for f in fees}

    result = []
    stats = {'paid': 0, 'unpaid': 0, 'total_collected': 0, 'total_pending': 0}

    for s in students:
        fee = fee_map.get(s['id'])
        status = fee['status'] if fee else 'Unpaid'
        amount = fee['amount'] if fee else s['monthly_fee']

        result.append({
            'student_id':   s['id'],
            'student_name': s['name'],
            'grade':        s['grade'],
            'fee_id':       fee['id'] if fee else None,
            'status':       status,
            'amount':       amount,
            'payment_date': fee['payment_date'] if fee else None,
        })

        if status == 'Paid':
            stats['paid'] += 1
            stats['total_collected'] += amount or 0
        else:
            stats['unpaid'] += 1
            stats['total_pending'] += amount or 0

    return success({'students': result, 'stats': stats})


@app.route('/api/fees/quick-pay', methods=['POST'])
@jwt_required()
def quick_pay():
    """Mark a student's fee as paid for a given month."""
    tuition_id = get_tuition_id()
    data = request.get_json(silent=True, force=True) or {}

    student_id = data.get('student_id')
    month_year = data.get('month_year')
    amount     = data.get('amount', 0)

    if not student_id or not month_year:
        return error('Student ID and month_year are required.')

    today = datetime.now().strftime('%Y-%m-%d')
    conn  = get_db_connection()

    existing = conn.execute(
        'SELECT id FROM fees WHERE tuition_id = ? AND student_id = ? AND month_year = ?',
        (tuition_id, student_id, month_year)
    ).fetchone()

    if existing:
        conn.execute(
            'UPDATE fees SET status = "Paid", amount = ?, payment_date = ? WHERE id = ?',
            (amount, today, existing['id'])
        )
    else:
        conn.execute(
            'INSERT INTO fees (tuition_id, student_id, month_year, amount, status, payment_date) VALUES (?, ?, ?, ?, "Paid", ?)',
            (tuition_id, student_id, month_year, amount, today)
        )

    conn.commit()
    conn.close()

    return success(message='Payment recorded successfully!')


@app.route('/api/fees/student/<int:student_id>', methods=['GET'])
@jwt_required()
def get_student_fees(student_id):
    """Get full fee history for a single student."""
    tuition_id = get_tuition_id()
    conn = get_db_connection()

    fees = conn.execute(
        'SELECT * FROM fees WHERE tuition_id = ? AND student_id = ? ORDER BY month_year DESC',
        (tuition_id, student_id)
    ).fetchall()
    conn.close()

    return success([dict(f) for f in fees])


@app.route('/api/fees/<int:fee_id>', methods=['PUT'])
@jwt_required()
def update_fee(fee_id):
    """Update a fee record's status and payment date."""
    tuition_id = get_tuition_id()
    data = request.get_json(silent=True, force=True) or {}

    conn = get_db_connection()
    conn.execute(
        'UPDATE fees SET status = ?, payment_date = ? WHERE id = ? AND tuition_id = ?',
        (data.get('status'), data.get('payment_date'), fee_id, tuition_id)
    )
    conn.commit()
    conn.close()

    return success(message='Fee updated successfully!')


# ══════════════════════════════════════════
#  ANNOUNCEMENTS ROUTES
# ══════════════════════════════════════════

@app.route('/api/announcements', methods=['GET'])
@jwt_required()
def get_announcements():
    """Get recent announcements for this tuition."""
    tuition_id = get_tuition_id()
    conn = get_db_connection()
    announcements = conn.execute(
        'SELECT * FROM announcements WHERE tuition_id = ? ORDER BY created_at DESC LIMIT 20',
        (tuition_id,)
    ).fetchall()
    conn.close()
    return success([dict(a) for a in announcements])


@app.route('/api/announcements', methods=['POST'])
@jwt_required()
def add_announcement():
    """Post a new announcement/instruction."""
    tuition_id = get_tuition_id()
    data = request.get_json(silent=True, force=True) or {}

    message      = data.get('message', '').strip()
    target_type  = data.get('target_type', 'all')
    target_value = data.get('target_value')

    if not message:
        return error('Message is required.')

    conn = get_db_connection()
    conn.execute(
        'INSERT INTO announcements (tuition_id, message, target_type, target_value) VALUES (?, ?, ?, ?)',
        (tuition_id, message, target_type, target_value)
    )
    conn.commit()
    conn.close()

    return success(message='Announcement sent!', status=201)


@app.route('/api/announcements/<int:announcement_id>', methods=['DELETE'])
@jwt_required()
def delete_announcement(announcement_id):
    """Delete an announcement."""
    tuition_id = get_tuition_id()
    conn = get_db_connection()
    conn.execute(
        'DELETE FROM announcements WHERE id = ? AND tuition_id = ?',
        (announcement_id, tuition_id)
    )
    conn.commit()
    conn.close()
    return success(message='Announcement deleted!')


# ══════════════════════════════════════════
#  PARENT REPORTS ROUTES
# ══════════════════════════════════════════

@app.route('/api/reports', methods=['GET'])
@jwt_required()
def get_reports():
    """Get all parent reports for this tuition (admin view)."""
    tuition_id = get_tuition_id()
    conn = get_db_connection()
    reports = conn.execute(
        '''SELECT r.*, s.name as student_name, s.grade
           FROM parent_reports r
           JOIN students s ON r.student_id = s.id
           WHERE r.tuition_id = ?
           ORDER BY r.created_at DESC''',
        (tuition_id,)
    ).fetchall()
    conn.close()
    return success([dict(r) for r in reports])


@app.route('/api/reports', methods=['POST'])
@jwt_required()
def submit_report():
    """Parent submits a report/message to the tuition admin."""
    identity   = get_jwt_identity()
    tuition_id = identity.get('tuition_id')
    data = request.get_json(silent=True, force=True) or {}

    student_id = data.get('student_id')
    message    = data.get('message', '').strip()

    if not student_id or not message:
        return error('Student ID and message are required.')

    conn = get_db_connection()
    conn.execute(
        'INSERT INTO parent_reports (tuition_id, student_id, message) VALUES (?, ?, ?)',
        (tuition_id, student_id, message)
    )
    conn.commit()
    conn.close()

    return success(message='Report submitted successfully!', status=201)


# ══════════════════════════════════════════
#  DASHBOARD ROUTE
# ══════════════════════════════════════════

@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Get summary stats for the admin dashboard."""
    tuition_id = get_tuition_id()
    conn = get_db_connection()

    # Count active students
    student_count = conn.execute(
        'SELECT COUNT(*) as c FROM students WHERE tuition_id = ? AND is_active = 1',
        (tuition_id,)
    ).fetchone()['c']

    # Fee stats for current month
    current_month = datetime.now().strftime('%Y-%m')
    fees = conn.execute(
        'SELECT * FROM fees WHERE tuition_id = ? AND month_year = ?',
        (tuition_id, current_month)
    ).fetchall()

    paid_count       = sum(1 for f in fees if f['status'] == 'Paid')
    total_collected  = sum(f['amount'] or 0 for f in fees if f['status'] == 'Paid')

    # Recent parent reports
    reports = conn.execute(
        '''SELECT r.*, s.name as student_name, s.grade
           FROM parent_reports r JOIN students s ON r.student_id = s.id
           WHERE r.tuition_id = ?
           ORDER BY r.created_at DESC LIMIT 5''',
        (tuition_id,)
    ).fetchall()

    # Recent announcements
    announcements = conn.execute(
        'SELECT * FROM announcements WHERE tuition_id = ? ORDER BY created_at DESC LIMIT 5',
        (tuition_id,)
    ).fetchall()

    # Birthday students this month
    current_month_num = str(datetime.now().month).zfill(2)
    all_students = conn.execute(
        'SELECT * FROM students WHERE tuition_id = ? AND is_active = 1',
        (tuition_id,)
    ).fetchall()

    birthday_students = []
    for s in all_students:
        dob = s.get('dob')
        if dob and len(dob) >= 7:
            try:
                dob_month = dob.split('-')[1]
                if dob_month == current_month_num:
                    birthday_students.append({'id': s['id'], 'name': s['name'], 'grade': s['grade'], 'dob': dob})
            except Exception:
                pass

    conn.close()

    return success({
        'student_count':    student_count,
        'paid_count':       paid_count,
        'total_collected':  total_collected,
        'reports':          [dict(r) for r in reports],
        'announcements':    [dict(a) for a in announcements],
        'birthday_students': birthday_students
    })


# ══════════════════════════════════════════
#  ANALYTICS ROUTE
# ══════════════════════════════════════════

@app.route('/api/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    """Get fee collection and attendance analytics for the last 6 months."""
    tuition_id = get_tuition_id()
    conn = get_db_connection()

    # Fee data — last 6 months
    fee_rows = conn.execute(
        '''SELECT month_year, SUM(amount) as total
           FROM fees
           WHERE tuition_id = ? AND status = "Paid"
           GROUP BY month_year
           ORDER BY month_year DESC LIMIT 6''',
        (tuition_id,)
    ).fetchall()

    # Attendance data — last 6 months
    now = datetime.now()
    months = [(now.year, now.month - i) for i in range(5, -1, -1)]
    months = [(y + m // 12 if m <= 0 else y, m % 12 if m <= 0 else m) for y, m in months]
    month_strings = [f"{y}-{str(m).zfill(2)}" for y, m in months]

    att_data = {}
    for m in month_strings:
        rows = conn.execute(
            '''SELECT COUNT(*) as total,
                      SUM(CASE WHEN status = "Present" THEN 1 ELSE 0 END) as present
               FROM attendance
               WHERE tuition_id = ? AND LEFT(date, 7) = ?''',
            (tuition_id, m)
        ).fetchone()
        total   = rows['total'] or 0
        present = rows['present'] or 0
        att_data[m] = round((present / total * 100), 1) if total > 0 else 0

    conn.close()

    return success({
        'fees': {
            'months': [r['month_year'] for r in fee_rows],
            'values': [r['total'] or 0 for r in fee_rows]
        },
        'attendance': {
            'months': month_strings,
            'values': [att_data[m] for m in month_strings]
        }
    })


# ══════════════════════════════════════════
#  PARENT PORTAL ROUTES
# ══════════════════════════════════════════

@app.route('/api/parent/home', methods=['GET'])
@jwt_required()
def parent_home():
    """Get parent dashboard data — children info, fees, activities, announcements."""
    identity     = get_jwt_identity()
    tuition_id   = identity.get('tuition_id')
    parent_phone = identity.get('parent_phone')

    conn = get_db_connection()

    students = conn.execute(
        'SELECT * FROM students WHERE tuition_id = ? AND parent_contact = ? AND is_active = 1',
        (tuition_id, parent_phone)
    ).fetchall()

    children_data = []
    for s in students:
        # Attendance stats
        att = conn.execute(
            '''SELECT COUNT(*) as total,
                      SUM(CASE WHEN status = "Present" THEN 1 ELSE 0 END) as present
               FROM attendance WHERE student_id = ? AND tuition_id = ?''',
            (s['id'], tuition_id)
        ).fetchone()
        total   = att['total'] or 0
        present = att['present'] or 0

        # Recent fees
        fees = conn.execute(
            'SELECT * FROM fees WHERE student_id = ? AND tuition_id = ? ORDER BY month_year DESC LIMIT 5',
            (s['id'], tuition_id)
        ).fetchall()

        # Recent activities
        activities = conn.execute(
            '''SELECT * FROM daily_activities
               WHERE student_id = ? AND tuition_id = ?
               ORDER BY activity_date DESC LIMIT 3''',
            (s['id'], tuition_id)
        ).fetchall()

        children_data.append({
            'student': dict(s),
            'attendance': {
                'total':      total,
                'present':    present,
                'percentage': round((present / total * 100), 1) if total > 0 else 0
            },
            'fees':       [dict(f) for f in fees],
            'activities': [dict(a) for a in activities]
        })

    # Announcements relevant to these students
    all_announcements = conn.execute(
        'SELECT * FROM announcements WHERE tuition_id = ? ORDER BY created_at DESC LIMIT 20',
        (tuition_id,)
    ).fetchall()

    student_ids = [s['id'] for s in students]
    grades      = [s['grade'] for s in students]
    filtered    = []
    for ann in all_announcements:
        if ann['target_type'] == 'all' or ann['target_type'] is None:
            filtered.append(dict(ann))
        elif ann['target_type'] == 'grade' and ann['target_value'] and int(ann['target_value']) in grades:
            filtered.append(dict(ann))
        elif ann['target_type'] == 'student' and ann['target_value'] and int(ann['target_value']) in student_ids:
            filtered.append(dict(ann))

    conn.close()

    return success({
        'children':       children_data,
        'announcements':  filtered[:5]
    })


@app.route('/api/parent/activities/<int:student_id>', methods=['GET'])
@jwt_required()
def parent_get_activities(student_id):
    """Get activities for a student (parent view, filtered by month)."""
    identity     = get_jwt_identity()
    tuition_id   = identity.get('tuition_id')
    parent_phone = identity.get('parent_phone')

    month = request.args.get('month', datetime.now().strftime('%Y-%m'))

    conn = get_db_connection()

    # Verify this student belongs to this parent
    student = conn.execute(
        'SELECT * FROM students WHERE id = ? AND tuition_id = ? AND parent_contact = ?',
        (student_id, tuition_id, parent_phone)
    ).fetchone()

    if not student:
        conn.close()
        return error('Access denied.', 403)

    activities = conn.execute(
        '''SELECT * FROM daily_activities
           WHERE student_id = ? AND tuition_id = ? AND LEFT(activity_date, 7) = ?
           ORDER BY activity_date DESC''',
        (student_id, tuition_id, month)
    ).fetchall()
    conn.close()

    return success([dict(a) for a in activities])


# ══════════════════════════════════════════
#  PUBLIC ROUTES (No Auth)
# ══════════════════════════════════════════

@app.route('/api/tuitions/search', methods=['GET'])
def search_tuitions():
    """Search for a tuition by name or phone (for parent login screen)."""
    query = request.args.get('q', '').strip()
    if len(query) < 2:
        return success([])

    conn = get_db_connection()
    tuitions = conn.execute(
        '''SELECT id, name, phone, address FROM tuitions
           WHERE (name LIKE ? OR phone LIKE ?) AND is_active = 1 LIMIT 10''',
        (f'%{query}%', f'%{query}%')
    ).fetchall()
    conn.close()

    return success([dict(t) for t in tuitions])


# ──────────────────────────────────────────
#  Run the app
# ──────────────────────────────────────────
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
