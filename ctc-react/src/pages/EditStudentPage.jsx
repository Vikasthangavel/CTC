import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudent, updateStudent, deleteStudent } from '../services/firestore';
import Loader from '../components/Loader';
import Icon from '../components/Icon';
import { useToast } from '../components/Toast';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-','A1B+',"A1+"];

export default function EditStudentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStudent(id).then(s => {
      if (s) setForm({ name: s.name||'', grade: s.grade||'', parent_name: s.parent_name||'', parent_contact: s.parent_contact||'', monthly_fee: s.monthly_fee||'', dob: s.dob||'', blood_group: s.blood_group||'', is_active: s.is_active !== false });
    });
  }, [id]);

  const handle = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateStudent(id, { ...form, grade: Number(form.grade), monthly_fee: Number(form.monthly_fee) });
      showToast('Student updated!', 'success');
      navigate('/students');
    } catch {
      showToast('Failed to update student', 'danger');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (form.is_active) {
      showToast('Cannot delete an active student. Please deactivate them first.', 'danger');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete student "${form.name}"? This action cannot be undone.`)) return;
    setSaving(true);
    try {
      await deleteStudent(id);
      showToast('Student deleted successfully', 'success');
      navigate('/students');
    } catch {
      showToast('Failed to delete student', 'danger');
    } finally { setSaving(false); }
  };

  if (!form) return <Loader />;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/students')} style={{ gap: '4px' }}><Icon name="arrowLeft" size={14} /> Back</button>
        <h2 style={{ margin: 0 }}>Edit Student</h2>
      </div>

      <div className="card">
        <div className="card-body">
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
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input name="is_active" type="checkbox" checked={form.is_active} onChange={handle} style={{ width: '18px', height: '18px' }} />
                <span className="form-label" style={{ margin: 0 }}>Active Student</span>
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/students')}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ gap: '6px' }}>
                  <Icon name="save" size={14} /> {saving ? 'Saving...' : 'Update Student'}
                </button>
              </div>
              {!form.is_active && (
                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving} style={{ gap: '6px' }}>
                  <Icon name="trash" size={14} /> Delete Student
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
