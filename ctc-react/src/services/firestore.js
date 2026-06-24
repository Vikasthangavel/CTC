// Firebase Firestore service layer
// Replaces the Flask/MySQL backend with Firestore CRUD operations

import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  getDoc, setDoc, query, where, orderBy, limit, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── HELPERS ─────────────────────────────────────────────
const snap2arr = (snap) => snap.docs.map(d => ({ id: d.id, ...d.data() }));

// ─── STUDENTS ─────────────────────────────────────────────
export async function getStudents(activeOnly = true) {
  const col = collection(db, 'students');
  const snap = await getDocs(col);
  let students = snap2arr(snap);
  if (activeOnly) students = students.filter(s => s.is_active !== false);
  return students;
}

export async function getStudent(id) {
  const ref = doc(db, 'students', id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function addStudent(data) {
  return await addDoc(collection(db, 'students'), {
    ...data, is_active: true, created_at: serverTimestamp()
  });
}

export async function updateStudent(id, data) {
  await updateDoc(doc(db, 'students', id), data);
}

export async function deleteStudent(id) {
  await deleteDoc(doc(db, 'students', id));
}

export async function toggleStudentActive(id, currentStatus) {
  await updateDoc(doc(db, 'students', id), { is_active: !currentStatus });
}

function normalizePhone(raw) {
  // Strip spaces, dashes, dots
  let p = String(raw || '').replace(/[\s\-\.]/g, '');
  // Remove leading +91 or 0091 (India) country code
  if (p.startsWith('+91')) p = p.slice(3);
  else if (p.startsWith('0091')) p = p.slice(4);
  // Remove leading 0
  if (p.startsWith('0') && p.length === 11) p = p.slice(1);
  return p;
}

export async function getStudentByParentPhone(phone) {
  const normalized = normalizePhone(phone);
  // Try exact match first
  const q1 = query(collection(db, 'students'), where('parent_contact', '==', phone));
  const snap1 = await getDocs(q1);
  if (!snap1.empty) return snap2arr(snap1);

  // Try normalized (10-digit) match
  if (normalized !== phone) {
    const q2 = query(collection(db, 'students'), where('parent_contact', '==', normalized));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) return snap2arr(snap2);
  }

  // Fallback: load all and filter client-side (handles any format mismatch)
  const allSnap = await getDocs(collection(db, 'students'));
  const all = snap2arr(allSnap);
  return all.filter(s => normalizePhone(s.parent_contact) === normalized);
}

// ─── ATTENDANCE ─────────────────────────────────────────────
export async function getAttendanceByDate(date) {
  const ref = doc(db, 'attendance', date);
  const snap = await getDoc(ref);
  const map = {};
  if (snap.exists()) {
    const data = snap.data();
    const statuses = data.statuses || {};
    Object.entries(statuses).forEach(([studentId, status]) => {
      map[studentId] = {
        id: snap.id,
        student_id: studentId,
        date: snap.id,
        status: status
      };
    });
  }
  return map;
}

export async function saveBulkAttendance(date, statusMap) {
  // statusMap: { student_id: 'Present'|'Absent' }
  const ref = doc(db, 'attendance', date);
  await setDoc(ref, {
    date: date,
    statuses: statusMap
  }, { merge: true });
}

export async function getMonthlyAttendanceStats(month, students) {
  // month = 'YYYY-MM'
  const q = query(
    collection(db, 'attendance'),
    where('date', '>=', month + '-01'),
    where('date', '<=', month + '-31')
  );
  const snap = await getDocs(q);
  const dateDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  return students.map(s => {
    let total = 0;
    let present = 0;
    for (const doc of dateDocs) {
      const statuses = doc.statuses || {};
      if (statuses[s.id] !== undefined) {
        total++;
        if (statuses[s.id] === 'Present') {
          present++;
        }
      }
    }
    const percentage = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
    return { name: s.name, grade: s.grade, total, present, percentage };
  });
}

export async function getStudentAttendanceStats(studentId) {
  const col = collection(db, 'attendance');
  const snap = await getDocs(col);
  let total = 0;
  let present = 0;
  snap.docs.forEach(d => {
    const data = d.data();
    const statuses = data.statuses || {};
    if (statuses[studentId] !== undefined) {
      total++;
      if (statuses[studentId] === 'Present') {
        present++;
      }
    }
  });
  const percentage = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
  return { total, present, percentage };
}

// ─── FEES ─────────────────────────────────────────────
export async function getFeesByMonth(monthYear) {
  const q = query(collection(db, 'fees'), where('month_year', '==', monthYear));
  const snap = await getDocs(q);
  const map = {};
  snap.docs.forEach(d => { map[d.data().student_id] = { id: d.id, ...d.data() }; });
  return map;
}

export async function getStudentFees(studentId) {
  // No orderBy to avoid composite index — sort client-side (YYYY-MM strings sort lexicographically)
  const q = query(collection(db, 'fees'), where('student_id', '==', studentId));
  const snap = await getDocs(q);
  return snap2arr(snap).sort((a, b) => b.month_year.localeCompare(a.month_year));
}

export async function quickPay(studentId, monthYear, amount) {
  const q = query(collection(db, 'fees'), where('student_id', '==', studentId), where('month_year', '==', monthYear));
  const snap = await getDocs(q);
  const today = new Date().toISOString().split('T')[0];

  if (!snap.empty) {
    const docId = snap.docs[0].id;
    await updateDoc(doc(db, 'fees', docId), { status: 'Paid', payment_date: today });
    return docId;
  } else {
    const docRef = await addDoc(collection(db, 'fees'), { student_id: studentId, month_year: monthYear, amount, status: 'Paid', payment_date: today });
    return docRef.id;
  }
}

export async function addFeeRecord(data) {
  const docRef = await addDoc(collection(db, 'fees'), data);
  return docRef.id;
}

export async function getFee(id) {
  const ref = doc(db, 'fees', id);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ─── ACTIVITIES ─────────────────────────────────────────────
export async function addActivity(studentId, activityDate, content) {
  await addDoc(collection(db, 'activities'), {
    student_id: studentId, activity_date: activityDate, content, created_at: serverTimestamp()
  });
}

export async function getActivitiesByMonth(studentId, month) {
  // No orderBy to avoid requiring a composite index — sort client-side
  const q = query(
    collection(db, 'activities'),
    where('student_id', '==', studentId),
    where('activity_date', '>=', month + '-01'),
    where('activity_date', '<=', month + '-31')
  );
  const snap = await getDocs(q);
  return snap2arr(snap).sort((a, b) => b.activity_date.localeCompare(a.activity_date));
}

export async function getRecentActivities(studentId, limitN = 2) {
  // No orderBy to avoid requiring a composite Firestore index — sort client-side
  const q = query(
    collection(db, 'activities'),
    where('student_id', '==', studentId)
  );
  const snap = await getDocs(q);
  return snap2arr(snap)
    .sort((a, b) => b.activity_date.localeCompare(a.activity_date))
    .slice(0, limitN);
}

export async function deleteActivity(id) {
  await deleteDoc(doc(db, 'activities', id));
}

// ─── INSTRUCTIONS ─────────────────────────────────────────────
export async function getInstructions(limitN = 5) {
  const q = query(collection(db, 'instructions'), orderBy('created_at', 'desc'), limit(limitN));
  const snap = await getDocs(q);
  return snap2arr(snap);
}

export async function getAllInstructions() {
  const q = query(collection(db, 'instructions'), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap2arr(snap);
}

export async function addInstruction(message, targetType, targetValue) {
  await addDoc(collection(db, 'instructions'), {
    message, target_type: targetType, target_value: targetValue || null, created_at: serverTimestamp()
  });
}

export async function deleteInstruction(id) {
  await deleteDoc(doc(db, 'instructions', id));
}

export async function getInstructionsForParent(studentIds, grades) {
  const all = await getAllInstructions();
  return all.filter(i => {
    if (!i.target_type || i.target_type === 'all') return true;
    if (i.target_type === 'grade') return grades.map(String).includes(String(i.target_value));
    if (i.target_type === 'student') return studentIds.includes(i.target_value);
    return false;
  }).slice(0, 5);
}

// ─── PARENT REPORTS ─────────────────────────────────────────────
export async function submitParentReport(studentId, message) {
  await addDoc(collection(db, 'parent_reports'), {
    student_id: studentId, message, status: 'Unread', report_date: serverTimestamp()
  });
}

export async function getParentReports(limitN = 5) {
  const q = query(collection(db, 'parent_reports'), orderBy('report_date', 'desc'), limit(limitN));
  const snap = await getDocs(q);
  return snap2arr(snap);
}

export async function getAllParentReports() {
  const q = query(collection(db, 'parent_reports'), orderBy('report_date', 'desc'));
  const snap = await getDocs(q);
  return snap2arr(snap);
}

// ─── PUNCH IN / PUNCH OUT ─────────────────────────────────────────────
// Doc ID = "{date}_{studentId}" for easy keyed lookup without composite indexes

function punchDocId(date, studentId) {
  return `${date}_${studentId}`;
}

function nowTimeStr() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export async function punchIn(studentId, date) {
  const ref = doc(db, 'punches', punchDocId(date, studentId));
  await setDoc(ref, {
    student_id: studentId,
    date,
    punch_in: nowTimeStr(),
    punch_out: null,
    updated_at: serverTimestamp(),
  }, { merge: true });
}

export async function punchOut(studentId, date) {
  const ref = doc(db, 'punches', punchDocId(date, studentId));
  await updateDoc(ref, {
    punch_out: nowTimeStr(),
    updated_at: serverTimestamp(),
  });
}

export async function resetPunch(studentId, date) {
  const ref = doc(db, 'punches', punchDocId(date, studentId));
  await setDoc(ref, {
    student_id: studentId,
    date,
    punch_in: null,
    punch_out: null,
    updated_at: serverTimestamp(),
  });
}

export async function getPunchRecord(studentId, date) {
  const ref = doc(db, 'punches', punchDocId(date, studentId));
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Get all punch records for a given date (for admin attendance view)
export async function getPunchesByDate(date) {
  const q = query(collection(db, 'punches'), where('date', '==', date));
  const snap = await getDocs(q);
  const map = {};
  snap.docs.forEach(d => { map[d.data().student_id] = { id: d.id, ...d.data() }; });
  return map;
}

// Get recent punch records for a student (for parent view — client-side sort)
export async function getStudentPunches(studentId, limitN = 5) {
  const q = query(collection(db, 'punches'), where('student_id', '==', studentId));
  const snap = await getDocs(q);
  return snap2arr(snap)
    .filter(p => p.punch_in)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limitN);
}
