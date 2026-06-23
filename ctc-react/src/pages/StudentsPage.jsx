import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getStudents, addStudent, updateStudent, toggleStudentActive,
  addActivity
} from '../services/firestore';
import Loader from '../components/Loader';
import Icon from '../components/Icon';
import { useToast } from '../components/Toast';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

function AddStudentModal({ onClose, onSaved }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name:'', grade:'', parent_name:'', parent_contact:'', monthly_fee:'', dob:'', blood_group:'' });
  const [saving, setSaving] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addStudent({ ...form, grade: Number(form.grade), monthly_fee: Number(form.monthly_fee) });
      showToast('Student added!', 'success');
      onSaved();
    } catch {
      showToast('Failed to add student', 'danger');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><Icon name="close" size={16} /></button>
        <h4><Icon name="user" size={18} /> Add New Student</h4>
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">Student Name</label><input name="name" className="form-control" value={form.name} onChange={handle} required /></div>
          <div className="form-group"><label className="form-label">Grade (1-12)</label><input name="grade" type="number" min="1" max="12" className="form-control" value={form.grade} onChange={handle} required /></div>
          <div className="row">
            <div className="col">
              <div className="form-group"><label className="form-label">Date of Birth</label><input name="dob" type="date" className="form-control" value={form.dob} onChange={handle} /></div>
            </div>
            <div className="col">
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select name="blood_group" className="form-select" value={form.blood_group} onChange={handle}>
                  <option value="">Select...</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg}>{bg}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="form-group"><label className="form-label">Parent Name</label><input name="parent_name" className="form-control" value={form.parent_name} onChange={handle} required /></div>
          <div className="form-group"><label className="form-label">Parent Contact (Phone)</label><input name="parent_contact" type="tel" className="form-control" value={form.parent_contact} onChange={handle} required /></div>
          <div className="form-group"><label className="form-label">Monthly Fee (₹)</label><input name="monthly_fee" type="number" className="form-control" value={form.monthly_fee} onChange={handle} required /></div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={saving}>
              <Icon name="check" size={14} /> {saving ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActivityModal({ student, onClose, onSaved }) {
  const { showToast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addActivity(student.id, date, content);
      showToast('Activity logged!', 'success');
      onSaved();
    } catch {
      showToast('Failed to log activity', 'danger');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><Icon name="close" size={16} /></button>
        <h4><Icon name="book" size={18} /> Daily Activity: {student.name}</h4>
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Activity / Homework / Note</label><textarea className="form-control" rows="4" value={content} onChange={e => setContent(e.target.value)} placeholder="Ex: Completed Chapter 5 Math exercises." required /></div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-warning" disabled={saving}>
              <Icon name="save" size={14} /> {saving ? 'Saving...' : 'Save Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BirthdayModal({ students, onClose }) {
  const currentMonth = new Date().getMonth() + 1;
  const birthdays = students.filter(s => {
    if (!s.dob) return false;
    return parseInt(s.dob.split('-')[1]) === currentMonth;
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><Icon name="close" size={16} /></button>
        <h4><Icon name="cake" size={18} /> Birthdays This Month</h4>
        {birthdays.length === 0 ? (
          <div className="text-center text-muted" style={{ padding: '32px' }}>No birthdays this month.</div>
        ) : (
          <div className="list-group">
            {birthdays.map(s => (
              <div key={s.id} className="list-group-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="fw-bold">{s.name}</div>
                  <div className="fs-sm text-muted">Grade {s.grade}</div>
                </div>
                <span className="badge badge-warning">{s.dob}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activityStudent, setActivityStudent] = useState(null);
  const [showBirthday, setShowBirthday] = useState(false);

  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const all = await getStudents(false);
      setAllStudents(all);
      setStudents(showInactive ? all : all.filter(s => s.is_active !== false));
    } finally { setLoading(false); }
  }

  useEffect(() => {
    setStudents(showInactive ? allStudents : allStudents.filter(s => s.is_active !== false));
  }, [showInactive, allStudents]);

  async function handleToggleActive(s) {
    const label = s.is_active !== false ? 'Deactivate' : 'Reactivate';
    if (!confirm(`${label} ${s.name}?`)) return;
    await toggleStudentActive(s.id, s.is_active !== false);
    showToast(`Student ${label.toLowerCase()}d`, 'success');
    fetchAll();
  }

  const bloodGroups = {};
  allStudents.forEach(s => {
    const bg = s.blood_group || 'Not Set';
    bloodGroups[bg] = (bloodGroups[bg] || 0) + 1;
  });

  const gradeMap = {};
  students.forEach(s => {
    const g = String(s.grade ?? 'N/A');
    gradeMap[g] = (gradeMap[g] || 0) + 1;
  });
  const gradeList = Object.entries(gradeMap).sort((a, b) => Number(a[0]) - Number(b[0]));
  const birthdayCount = allStudents.filter(s => s.dob && parseInt(s.dob.split('-')[1]) === currentMonth).length;

  if (loading) return <Loader />;

  return (
    <>
      {showAddModal && (
        <AddStudentModal onClose={() => setShowAddModal(false)} onSaved={() => { setShowAddModal(false); fetchAll(); }} />
      )}
      {activityStudent && (
        <ActivityModal student={activityStudent} onClose={() => setActivityStudent(null)} onSaved={() => { setActivityStudent(null); showToast('Activity saved!', 'success'); }} />
      )}
      {showBirthday && <BirthdayModal students={allStudents} onClose={() => setShowBirthday(false)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Student Management</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setShowInactive(v => !v)}>
            <Icon name={showInactive ? 'eyeOff' : 'eye'} size={14} />
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </button>
          <button className="btn btn-success" onClick={() => setShowAddModal(true)}>
            <Icon name="plus" size={14} /> Add Student
          </button>
        </div>
      </div>

      {/* Student Table */}
      <div className="card mb-4">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Grade</th>
                <th>Parent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id} style={{ opacity: s.is_active === false ? 0.5 : 1 }}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{i + 1}</td>
                  <td>
                    <Link to={`/students/${s.id}/edit`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                      {s.name}
                    </Link>
                    {s.is_active === false && <span className="badge badge-secondary" style={{ marginLeft: '6px' }}>Inactive</span>}
                  </td>
                  <td>{s.grade}</td>
                  <td style={{ fontSize: '0.85rem' }}>{s.parent_name}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {s.is_active !== false && (
                        <>
                          <button className="btn btn-warning btn-sm" onClick={() => setActivityStudent(s)} title="Add Activity">
                            <Icon name="book" size={13} />
                          </button>
                          <Link to={`/students/${s.id}/report`} className="btn btn-info btn-sm" title="View Report">
                            <Icon name="chart" size={13} />
                          </Link>
                          <a href={`tel:${s.parent_contact}`} className="btn btn-secondary btn-sm" title="Call Parent">
                            <Icon name="phone" size={13} />
                          </a>
                        </>
                      )}
                      <button
                        className={`btn btn-sm ${s.is_active !== false ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggleActive(s)}
                        title={s.is_active !== false ? 'Deactivate' : 'Reactivate'}
                      >
                        {s.is_active !== false
                          ? <Icon name="close" size={13} />
                          : <Icon name="check" size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No students found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="card">
        <div className="card-header">Student Summary</div>
        <div className="card-body">
          <div className="row">
            {/* Birthdays */}
            <div className="col-3">
              <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowBirthday(true)}>
                <Icon name="cake" size={28} style={{ color: 'var(--info)', marginBottom: '4px' }} />
                <div className="stat-card__number text-info">{birthdayCount}</div>
                <div className="stat-card__label">Birthdays this Month</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Click to view</div>
              </div>
            </div>

            {/* Grades */}
            <div className="col">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '8px' }}>Students per Grade</div>
              <table style={{ width: '100%' }}>
                <thead><tr><th>Grade</th><th style={{ textAlign: 'right' }}>Count</th></tr></thead>
                <tbody>
                  {gradeList.map(([g, c]) => (
                    <tr key={g}><td>Grade {g}</td><td style={{ textAlign: 'right', fontWeight: 700 }}>{c}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Blood Groups */}
            <div className="col">
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '8px' }}>Blood Groups</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(bloodGroups).map(([bg, c]) => (
                  <span key={bg} className="badge badge-danger" style={{ fontSize: '0.85em' }}>
                    {bg} <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '99px', padding: '1px 6px', marginLeft: '4px' }}>{c}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
