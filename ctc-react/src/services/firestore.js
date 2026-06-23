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

export async function getStudentByParentPhone(phone) {
  const q = query(collection(db, 'students'), where('parent_contact', '==', phone));
  const snap = await getDocs(q);
  return snap2arr(snap);
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
  const q = query(collection(db, 'fees'), where('student_id', '==', studentId), orderBy('month_year', 'desc'));
  const snap = await getDocs(q);
  return snap2arr(snap);
}

export async function quickPay(studentId, monthYear, amount) {
  const q = query(collection(db, 'fees'), where('student_id', '==', studentId), where('month_year', '==', monthYear));
  const snap = await getDocs(q);
  const today = new Date().toISOString().split('T')[0];

  if (!snap.empty) {
    await updateDoc(doc(db, 'fees', snap.docs[0].id), { status: 'Paid', payment_date: today });
  } else {
    await addDoc(collection(db, 'fees'), { student_id: studentId, month_year: monthYear, amount, status: 'Paid', payment_date: today });
  }
}

export async function addFeeRecord(data) {
  await addDoc(collection(db, 'fees'), data);
}

// ─── ACTIVITIES ─────────────────────────────────────────────
export async function addActivity(studentId, activityDate, content) {
  await addDoc(collection(db, 'activities'), {
    student_id: studentId, activity_date: activityDate, content, created_at: serverTimestamp()
  });
}

export async function getActivitiesByMonth(studentId, month) {
  const q = query(
    collection(db, 'activities'),
    where('student_id', '==', studentId),
    where('activity_date', '>=', month + '-01'),
    where('activity_date', '<=', month + '-31'),
    orderBy('activity_date', 'desc')
  );
  const snap = await getDocs(q);
  return snap2arr(snap);
}

export async function getRecentActivities(studentId, limitN = 2) {
  const q = query(
    collection(db, 'activities'),
    where('student_id', '==', studentId),
    orderBy('activity_date', 'desc'),
    limit(limitN)
  );
  const snap = await getDocs(q);
  return snap2arr(snap);
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
