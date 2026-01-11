from flask import Flask, render_template, request, redirect, url_for, session, flash
from datetime import datetime
from db import init_db, get_db_connection

app = Flask(__name__)
app.secret_key = 'poiuytrdfghjnbvcde'  # Change this to a random secret key

# Initialize DB if not exists
init_db()

def is_logged_in():
    return 'admin_id' in session

@app.route('/')
def index():
    if is_logged_in():
        return redirect(url_for('dashboard'))
    if 'parent_phone' in session:
        return redirect(url_for('parent_dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    phone = None
    admin_mode = False

    if request.method == 'POST':
        phone = request.form.get('phone')
        password = request.form.get('password')
        
        # Admin Login Logic
        if phone == '9524439288':
            if password:
                # Password matches current day and month (DDMM)
                current_pass = datetime.now().strftime('%d%m')
                if password == current_pass:
                    session['admin_id'] = 1 # Hardcoded ID for this special admin
                    session['username'] = 'admin'
                    return redirect(url_for('dashboard'))
                else:
                    error = 'Invalid Admin Password'
                    admin_mode = True
            else:
                # First step passed, show password field
                admin_mode = True
        
        # Parent Login Logic
        else:
            conn = get_db_connection()
            # Check if phone exists in students table
            student = conn.execute('SELECT * FROM students WHERE parent_contact = ?', (phone,)).fetchone()
            conn.close()

            if student:
                session['parent_phone'] = phone
                return redirect(url_for('parent_dashboard'))
            else:
                error = 'Phone number not registered with any student.'

    return render_template('login.html', error=error, phone=phone, admin_mode=admin_mode)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/parent-dashboard')
def parent_dashboard():
    if 'parent_phone' not in session: return redirect(url_for('login'))
    
    phone = session['parent_phone']
    
    conn = get_db_connection()
    students = conn.execute('SELECT * FROM students WHERE parent_contact = ?', (phone,)).fetchall()
    
    children_data = []
    
    for s in students:
        # Attendance Stats (All time or Current Month?) -> Let's do All Time for simplicity or last 30 days
        # Based on previous implementation logic:
        stats_query = '''
            SELECT 
                COUNT(id) as total_marked,
                SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count
            FROM attendance
            WHERE student_id = ?
        '''
        stats_row = conn.execute(stats_query, (s['id'],)).fetchone()
        
        total = stats_row['total_marked']
        present = stats_row['present_count'] if stats_row['present_count'] else 0
        percentage = round((present / total * 100), 1) if total > 0 else 0
        
        # Recent Fees
        fees = conn.execute('SELECT * FROM fees WHERE student_id = ? ORDER BY id DESC LIMIT 5', (s['id'],)).fetchall()
        
        # Recent Activities (Limit to 2 for dashboard)
        activities = conn.execute('SELECT * FROM daily_activities WHERE student_id = ? ORDER BY activity_date DESC, created_at DESC LIMIT 2', (s['id'],)).fetchall()
        
        children_data.append({
            'student': s,
            'attendance_stats': {'total': total, 'present': present, 'percentage': percentage},
            'fees': fees,
            'activities': activities
        })
        
    conn.close()
    return render_template('parent_dashboard.html', children_data=children_data)

@app.route('/parent/activity_report/<int:student_id>')
def parent_activity_report(student_id):
    if 'parent_phone' not in session: return redirect(url_for('login'))
    
    conn = get_db_connection()
    # Verify student belongs to parent
    student = conn.execute('SELECT * FROM students WHERE id = ? AND parent_contact = ?', 
                          (student_id, session['parent_phone'])).fetchone()
    
    if not student:
        conn.close()
        flash('Access Denied.')
        return redirect(url_for('parent_dashboard'))
    
    # Get month from query or default to current
    selected_month = request.args.get('month', datetime.now().strftime('%Y-%m'))
    
    # Query activities for that month
    query = '''
        SELECT * FROM daily_activities 
        WHERE student_id = ? AND LEFT(activity_date, 7) = ?
        ORDER BY activity_date DESC, created_at DESC
    '''
    activities = conn.execute(query, (student_id, selected_month)).fetchall()
    conn.close()
    
    # Format month name for display
    dt = datetime.strptime(selected_month, '%Y-%m')
    selected_month_name = dt.strftime('%B %Y')
    
    return render_template('parent_activity_report.html', 
                         student=student, 
                         activities=activities, 
                         selected_month=selected_month,
                         selected_month_name=selected_month_name)

@app.route('/dashboard')
def dashboard():
    if not is_logged_in(): return redirect(url_for('login'))
    
    conn = get_db_connection()
    student_count = conn.execute('SELECT COUNT(*) FROM students').fetchone()[0]
    conn.close()
    
    return render_template('dashboard.html', student_count=student_count)

# --- Student Management ---

@app.route('/students')
def students():
    if not is_logged_in(): return redirect(url_for('login'))
    
    conn = get_db_connection()
    students = conn.execute('SELECT * FROM students').fetchall()
    conn.close()
    return render_template('students.html', students=students)

@app.route('/students/add', methods=['POST'])
def add_student():
    if not is_logged_in(): return redirect(url_for('login'))
    
    if request.method == 'POST':
        name = request.form['name']
        grade = request.form['grade']
        parent_name = request.form['parent_name']
        parent_contact = request.form['parent_contact']
        monthly_fee = request.form['monthly_fee']
        
        conn = get_db_connection()
        conn.execute('INSERT INTO students (name, grade, parent_name, parent_contact, monthly_fee) VALUES (?, ?, ?, ?, ?)',
                     (name, grade, parent_name, parent_contact, monthly_fee))
        conn.commit()
        conn.close()
        flash('Student added successfully!')
    return redirect(url_for('students'))

@app.route('/students/add_activity', methods=['POST'])
def add_activity():
    if not is_logged_in(): return redirect(url_for('login'))
    
    if request.method == 'POST':
        student_id = request.form['student_id']
        content = request.form['content']
        activity_date = request.form.get('activity_date', datetime.now().strftime('%Y-%m-%d'))
        
        conn = get_db_connection()
        conn.execute('INSERT INTO daily_activities (student_id, activity_date, content) VALUES (?, ?, ?)',
                     (student_id, activity_date, content))
        conn.commit()
        conn.close()
        flash('Activity logged successfully.')
        
    return redirect(url_for('students'))

@app.route('/students/activity_report/<int:student_id>')
def activity_report(student_id):
    if not is_logged_in(): return redirect(url_for('login'))
    
    conn = get_db_connection()
    student = conn.execute('SELECT * FROM students WHERE id = ?', (student_id,)).fetchone()
    
    # Get month from query or default to current
    selected_month = request.args.get('month', datetime.now().strftime('%Y-%m'))
    
    # Query activities for that month
    query = '''
        SELECT * FROM daily_activities 
        WHERE student_id = ? AND LEFT(activity_date, 7) = ?
        ORDER BY activity_date DESC, created_at DESC
    '''
    activities = conn.execute(query, (student_id, selected_month)).fetchall()
    conn.close()
    
    # Format month name for display
    dt = datetime.strptime(selected_month, '%Y-%m')
    selected_month_name = dt.strftime('%B %Y')
    
    return render_template('activity_report.html', 
                         student=student, 
                         activities=activities, 
                         selected_month=selected_month,
                         selected_month_name=selected_month_name)

@app.route('/activity/delete/<int:id>', methods=['POST'])
def delete_activity(id):
    if not is_logged_in(): return redirect(url_for('login'))
    
    conn = get_db_connection()
    # Get student_id to redirect back
    activity = conn.execute('SELECT student_id, activity_date FROM daily_activities WHERE id = ?', (id,)).fetchone()
    if activity:
        student_id = activity['student_id']
        try:
            # Need to convert date to YYYY-MM for the redirection to keep context if possible, 
            # but simpler to just redirect to the report for that month
            activity_month = activity['activity_date'][:7] 
        except:
            activity_month = datetime.now().strftime('%Y-%m')
            
        conn.execute('DELETE FROM daily_activities WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        flash('Activity deleted.')
        return redirect(url_for('activity_report', student_id=student_id, month=activity_month))
    
    conn.close()
    return redirect(url_for('students'))

@app.route('/students/edit/<int:id>', methods=['GET', 'POST'])
def edit_student(id):
    if not is_logged_in(): return redirect(url_for('login'))
    
    conn = get_db_connection()
    if request.method == 'POST':
        name = request.form['name']
        grade = request.form['grade']
        parent_name = request.form['parent_name']
        parent_contact = request.form['parent_contact']
        monthly_fee = request.form['monthly_fee']
        
        conn.execute('UPDATE students SET name = ?, grade = ?, parent_name = ?, parent_contact = ?, monthly_fee = ? WHERE id = ?',
                     (name, grade, parent_name, parent_contact, monthly_fee, id))
        conn.commit()
        conn.close()
        flash('Student updated successfully!')
        return redirect(url_for('students'))
    
    student = conn.execute('SELECT * FROM students WHERE id = ?', (id,)).fetchone()
    conn.close()
    return render_template('edit_student.html', student=student)

@app.route('/students/delete/<int:id>')
def delete_student(id):
    if not is_logged_in(): return redirect(url_for('login'))
    
    conn = get_db_connection()
    conn.execute('DELETE FROM students WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    flash('Student deleted successfully!')
    return redirect(url_for('students'))

# --- Attendance Management ---

@app.route('/attendance', methods=['GET', 'POST'])
def attendance():
    if not is_logged_in(): return redirect(url_for('login'))
    
    conn = get_db_connection()
    students = conn.execute('SELECT * FROM students').fetchall()
    
    selected_date = request.args.get('date')
    attendance_records = {} # Map student_id to status
    
    if selected_date:
        records = conn.execute('SELECT * FROM attendance WHERE date = ?', (selected_date,)).fetchall()
        for r in records:
            attendance_records[r['student_id']] = r['status']
            
    # --- Monthly Stats ---
    selected_month = request.args.get('month', datetime.now().strftime('%Y-%m'))
    
    stats_query = '''
        SELECT 
            s.id, s.name, s.grade,
            COUNT(a.id) as total_marked,
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_count
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id AND LEFT(a.date, 7) = ?
        GROUP BY s.id
    '''
    stats_data = conn.execute(stats_query, (selected_month,)).fetchall()
    
    stats = []
    for row in stats_data:
        total = row['total_marked']
        present = row['present_count'] if row['present_count'] else 0
        percentage = (present / total * 100) if total > 0 else 0
        stats.append({
            'name': row['name'],
            'grade': row['grade'],
            'total': total,
            'present': present,
            'percentage': round(percentage, 1)
        })

    conn.close()
    return render_template('attendance.html', 
                           students=students, 
                           date=selected_date, 
                           attendance=attendance_records,
                           stats=stats,
                           selected_month=selected_month)

@app.route('/attendance/mark', methods=['POST'])
def mark_attendance():
    if not is_logged_in(): return redirect(url_for('login'))
    
    date = request.form['date']
    student_id = request.form['student_id']
    status = request.form['status']
    
    conn = get_db_connection()
    # Check if exists
    existing = conn.execute('SELECT * FROM attendance WHERE student_id = ? AND date = ?', (student_id, date)).fetchone()
    
    if existing:
        conn.execute('UPDATE attendance SET status = ? WHERE id = ?', (status, existing['id']))
    else:
        conn.execute('INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)', (student_id, date, status))
        
    conn.commit()
    conn.close()
    return redirect(url_for('attendance', date=date))

@app.route('/attendance/history')
def attendance_history():
    if not is_logged_in(): return redirect(url_for('login'))
    
    conn = get_db_connection()
    # Join to get student names
    history = conn.execute('''
        SELECT a.*, s.name 
        FROM attendance a 
        JOIN students s ON a.student_id = s.id 
        ORDER BY date DESC
    ''').fetchall()
    conn.close()
    return render_template('attendance_history.html', history=history)

# --- Fee Management ---

@app.route('/fees', methods=['GET'])
def fees():
    if not is_logged_in(): return redirect(url_for('login'))
    
    selected_month = request.args.get('month', datetime.now().strftime('%Y-%m'))
    
    conn = get_db_connection()
    students = conn.execute('SELECT * FROM students').fetchall()
    
    # Fetch fees matching the selected month
    fees_records = conn.execute('SELECT * FROM fees WHERE month_year = ?', (selected_month,)).fetchall()
    fee_map = {f['student_id']: f for f in fees_records}
    
    student_fees_list = []
    for s in students:
        fee = fee_map.get(s['id'])
        if fee:
            status = fee['status']
            amount = fee['amount']
        else:
            status = 'Unpaid'
            amount = s['monthly_fee'] # Default
            
        student_fees_list.append({
            'student': s,
            'status': status,
            'amount': amount,
            'fee_id': fee['id'] if fee else None
        })
        
    conn.close()
    return render_template('fees.html', students=student_fees_list, selected_month=selected_month)

@app.route('/fees/quick_pay', methods=['POST'])
def quick_pay():
    if not is_logged_in(): return redirect(url_for('login'))
    
    student_id = request.form['student_id']
    month_year = request.form['month_year']
    amount = request.form['amount']
    
    payment_date = datetime.now().strftime('%Y-%m-%d')
    
    conn = get_db_connection()
    # Check if record exists
    existing = conn.execute('SELECT id FROM fees WHERE student_id = ? AND month_year = ?', (student_id, month_year)).fetchone()
    
    if existing:
        conn.execute('UPDATE fees SET status = "Paid", amount = ?, payment_date = ? WHERE id = ?', 
                     (amount, payment_date, existing['id']))
    else:
        conn.execute('INSERT INTO fees (student_id, month_year, amount, status, payment_date) VALUES (?, ?, ?, "Paid", ?)',
                     (student_id, month_year, amount, payment_date))
    
    conn.commit()
    conn.close()
    return redirect(url_for('fees', month=month_year))

@app.route('/fees/student/<int:student_id>', methods=['GET', 'POST'])
def student_fees(student_id):
    if not is_logged_in(): return redirect(url_for('login'))
    
    conn = get_db_connection()
    
    if request.method == 'POST':
        month_year = request.form['month_year']
        amount = request.form['amount']
        status = request.form['status']
        payment_date = request.form.get('payment_date', '')
        
        conn.execute('INSERT INTO fees (student_id, month_year, amount, status, payment_date) VALUES (?, ?, ?, ?, ?)',
                     (student_id, month_year, amount, status, payment_date))
        conn.commit()
    
    student = conn.execute('SELECT * FROM students WHERE id = ?', (student_id,)).fetchone()
    fees_history = conn.execute('SELECT * FROM fees WHERE student_id = ? ORDER BY id DESC', (student_id,)).fetchall()
    conn.close()
    
    return render_template('student_fees.html', student=student, fees=fees_history)

@app.route('/fees/update/<int:fee_id>', methods=['POST'])
def update_fee(fee_id):
    if not is_logged_in(): return redirect(url_for('login'))
    
    status = request.form['status']
    payment_date = request.form['payment_date']
    student_id = request.form['student_id']
    
    conn = get_db_connection()
    conn.execute('UPDATE fees SET status = ?, payment_date = ? WHERE id = ?', (status, payment_date, fee_id))
    conn.commit()
    conn.close()
    
    return redirect(url_for('student_fees', student_id=student_id))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
