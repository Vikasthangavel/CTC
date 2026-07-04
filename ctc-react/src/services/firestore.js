// Firebase Firestore service layer
// Replaces the Flask/MySQL backend with Firestore CRUD operations

import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  getDoc, setDoc, query, where, orderBy, limit, serverTimestamp, writeBatch,
  startAfter, increment, deleteField
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
  students.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
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
  if (!snap1.empty) {
    const students = snap2arr(snap1);
    students.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return students;
  }

  // Try normalized (10-digit) match
  if (normalized !== phone) {
    const q2 = query(collection(db, 'students'), where('parent_contact', '==', normalized));
    const snap2 = await getDocs(q2);
    if (!snap2.empty) {
      const students = snap2arr(snap2);
      students.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      return students;
    }
  }

  // Fallback: load all and filter client-side (handles any format mismatch)
  const allSnap = await getDocs(collection(db, 'students'));
  const all = snap2arr(allSnap);
  const students = all.filter(s => normalizePhone(s.parent_contact) === normalized);
  students.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return students;
}

// ─── ATTENDANCE ─────────────────────────────────────────────
export async function getAttendanceByDateAndSession(date, session) {
  let refId = `${date}_${session}`;
  let ref = doc(db, 'attendance', refId);
  let snap = await getDoc(ref);

  if (!snap.exists() && session === 'Evening') {
    const legacyRef = doc(db, 'attendance', date);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists()) {
      snap = legacySnap;
    }
  }

  const map = {};
  if (snap.exists()) {
    const data = snap.data();
    const statuses = data.statuses || {};
    Object.entries(statuses).forEach(([studentId, status]) => {
      map[studentId] = {
        id: snap.id,
        student_id: studentId,
        date: data.date || date,
        session: data.session || 'Evening',
        status: status
      };
    });
  }
  return map;
}

export async function saveBulkAttendance(date, session, statusMap) {
  // statusMap: { student_id: 'Present'|'Absent' }
  let refId = `${date}_${session}`;
  let ref = doc(db, 'attendance', refId);
  let oldSnap = await getDoc(ref);

  // Backward compatibility
  if (!oldSnap.exists() && session === 'Evening') {
    const legacyRef = doc(db, 'attendance', date);
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists()) {
      refId = date;
      ref = legacyRef;
      oldSnap = legacySnap;
    }
  }

  const oldStatuses = oldSnap.exists() ? (oldSnap.data().statuses || {}) : {};

  const batch = writeBatch(db);
  const allStudentIds = new Set([...Object.keys(oldStatuses), ...Object.keys(statusMap)]);

  const statusesToSave = {};
  for (const sId of allStudentIds) {
    const sOld = oldStatuses[sId];
    const sNew = statusMap[sId];

    let deltaTotal = 0;
    let deltaPresent = 0;

    if (sOld === undefined && sNew !== undefined) {
      deltaTotal = 1;
      if (sNew === 'Present') deltaPresent = 1;
      statusesToSave[sId] = sNew;
    } else if (sOld !== undefined && sNew === undefined) {
      deltaTotal = -1;
      if (sOld === 'Present') deltaPresent = -1;
      statusesToSave[sId] = deleteField();
    } else if (sOld !== undefined && sNew !== undefined) {
      if (sOld !== sNew) {
        if (sNew === 'Present') deltaPresent = 1;
        else if (sOld === 'Present') deltaPresent = -1;
      }
      statusesToSave[sId] = sNew;
    }

    if (deltaTotal !== 0 || deltaPresent !== 0) {
      const studentRef = doc(db, 'students', sId);
      const studentUpdate = {};
      if (deltaTotal !== 0) studentUpdate.attendance_total = increment(deltaTotal);
      if (deltaPresent !== 0) studentUpdate.attendance_present = increment(deltaPresent);
      batch.update(studentRef, studentUpdate);
    }
  }

  batch.set(ref, {
    date: date,
    session: session,
    statuses: statusesToSave
  }, { merge: true });

  await batch.commit();
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
  const ref = doc(db, 'students', studentId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    const total = data.attendance_total || 0;
    const present = data.attendance_present || 0;
    const percentage = total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
    return { total, present, percentage };
  }
  return { total: 0, present: 0, percentage: 0 };
}

export async function recalculateAllStudentsAttendance() {
  const [students, attendanceDocs] = await Promise.all([
    getStudents(false),
    getDocs(collection(db, 'attendance'))
  ]);

  const statsMap = {};
  students.forEach(s => {
    statsMap[s.id] = { total: 0, present: 0 };
  });

  attendanceDocs.forEach(d => {
    const data = d.data();
    const statuses = data.statuses || {};
    Object.keys(statuses).forEach(sId => {
      if (statsMap[sId]) {
        statsMap[sId].total++;
        if (statuses[sId] === 'Present') {
          statsMap[sId].present++;
        }
      }
    });
  });

  const batch = writeBatch(db);
  students.forEach(s => {
    const stats = statsMap[s.id];
    const ref = doc(db, 'students', s.id);
    batch.update(ref, {
      attendance_total: stats.total,
      attendance_present: stats.present
    });
  });

  await batch.commit();
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
  // Filter and sort client-side to avoid composite indexes
  const q = query(
    collection(db, 'activities'),
    where('student_id', '==', studentId)
  );
  const snap = await getDocs(q);
  const startStr = month + '-01';
  const endStr = month + '-31';
  
  return snap2arr(snap)
    .filter(a => a.activity_date >= startStr && a.activity_date <= endStr)
    .sort((a, b) => b.activity_date.localeCompare(a.activity_date));
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

export async function getAllParentReports(lastVisibleDoc = null, limitN = 10) {
  let q;
  if (lastVisibleDoc) {
    q = query(collection(db, 'parent_reports'), orderBy('report_date', 'desc'), startAfter(lastVisibleDoc), limit(limitN));
  } else {
    q = query(collection(db, 'parent_reports'), orderBy('report_date', 'desc'), limit(limitN));
  }
  const snap = await getDocs(q);
  return {
    reports: snap2arr(snap),
    lastDoc: snap.docs[snap.docs.length - 1] || null,
    hasMore: snap.docs.length === limitN
  };
}

// ─── PUNCH IN / PUNCH OUT ─────────────────────────────────────────────
// Doc ID = "{date}_{session}_{studentId}" for easy keyed lookup without composite indexes

async function getActualPunchDocId(date, session, studentId) {
  if (session === 'Evening') {
    const legacyId = `${date}_${studentId}`;
    const legacyRef = doc(db, 'punches', legacyId);
    const snap = await getDoc(legacyRef);
    if (snap.exists()) return legacyId;
  }
  return `${date}_${session}_${studentId}`;
}

function nowTimeStr() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export async function punchIn(studentId, date, session) {
  const docId = await getActualPunchDocId(date, session, studentId);
  const ref = doc(db, 'punches', docId);
  await setDoc(ref, {
    student_id: studentId,
    date,
    session,
    punch_in: nowTimeStr(),
    punch_out: null,
    updated_at: serverTimestamp(),
  }, { merge: true });
}

export async function punchOut(studentId, date, session) {
  const docId = await getActualPunchDocId(date, session, studentId);
  const ref = doc(db, 'punches', docId);
  await updateDoc(ref, {
    punch_out: nowTimeStr(),
    updated_at: serverTimestamp(),
  });
}

export async function resetPunch(studentId, date, session) {
  const docId = await getActualPunchDocId(date, session, studentId);
  const ref = doc(db, 'punches', docId);
  await setDoc(ref, {
    student_id: studentId,
    date,
    session,
    punch_in: null,
    punch_out: null,
    updated_at: serverTimestamp(),
  });
}

export async function getPunchRecord(studentId, date, session) {
  const docId = await getActualPunchDocId(date, session, studentId);
  const ref = doc(db, 'punches', docId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updatePunchTimes(studentId, date, session, punchInStr, punchOutStr) {
  const docId = await getActualPunchDocId(date, session, studentId);
  const ref = doc(db, 'punches', docId);
  const data = { updated_at: serverTimestamp(), session };
  if (punchInStr !== undefined) data.punch_in = punchInStr;
  if (punchOutStr !== undefined) data.punch_out = punchOutStr;
  
  await setDoc(ref, {
    student_id: studentId,
    date,
    ...data
  }, { merge: true });
}

// Get all punch records for a given date and session (for admin attendance view)
export async function getPunchesByDateAndSession(date, session) {
  const q = query(collection(db, 'punches'), where('date', '==', date));
  const snap = await getDocs(q);
  const map = {};
  snap.docs.forEach(d => {
    const data = d.data();
    const docSession = data.session || 'Evening';
    if (docSession === session) {
      map[data.student_id] = { id: d.id, ...data };
    }
  });
  return map;
}

// Get recent punch records for a student (for parent view — client-side sort)
export async function getStudentPunches(studentId, limitN = 5) {
  const q = query(collection(db, 'punches'), where('student_id', '==', studentId));
  const snap = await getDocs(q);
  return snap2arr(snap)
    .filter(p => p.punch_in)
    .sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      const sessionA = a.session || 'Evening';
      const sessionB = b.session || 'Evening';
      return sessionB.localeCompare(sessionA);
    })
    .slice(0, limitN);
}

// ─── ANALYTICS ─────────────────────────────────────────────
export async function getAnalyticsData() {
  // 1. Fetch all fees
  const feesSnap = await getDocs(collection(db, 'fees'));
  const feesMap = {};
  feesSnap.docs.forEach(d => {
    const data = d.data();
    if (data.status === 'Paid') {
      const month = data.month_year;
      const amount = Number(data.amount) || 0;
      feesMap[month] = (feesMap[month] || 0) + amount;
    }
  });

  // 2. Fetch attendance for last 6 months
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const startStr = sixMonthsAgo.toISOString().split('T')[0];

  const attQ = query(
    collection(db, 'attendance'),
    where('date', '>=', startStr),
    orderBy('date', 'asc')
  );
  const attSnap = await getDocs(attQ);

  const attMap = {};
  attSnap.docs.forEach(d => {
    const data = d.data();
    const date = data.date;
    const month = date.slice(0, 7);
    const statuses = data.statuses || {};

    if (!attMap[month]) {
      attMap[month] = { total: 0, present: 0 };
    }

    Object.values(statuses).forEach(stat => {
      attMap[month].total++;
      if (stat === 'Present') {
        attMap[month].present++;
      }
    });
  });

  // Format Fee Data
  const sortedFeeMonths = Object.keys(feesMap).sort();
  const feeValues = sortedFeeMonths.map(m => feesMap[m]);

  // Format Attendance Data
  const sortedAttMonths = Object.keys(attMap).sort();
  const attendanceRates = sortedAttMonths.map(m => {
    const { total, present } = attMap[m];
    return total > 0 ? Math.round((present / total) * 1000) / 10 : 0;
  });

  return {
    fees: {
      months: sortedFeeMonths,
      values: feeValues
    },
    attendance: {
      months: sortedAttMonths,
      values: attendanceRates
    }
  };
}
