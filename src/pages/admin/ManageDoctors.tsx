import React, { useState, useEffect } from 'react'
import { api, type Doctor, type Department } from '../../services/api'
import { Modal } from '../../components/Modal'
import { EmptyState } from '../../components/EmptyState'
import { PlusIcon, SearchIcon, StethoscopeIcon } from '../../components/Icons'

interface ManageDoctorsProps {
  onNotify: (message: string) => void
}

export const ManageDoctors: React.FC<ManageDoctorsProps> = ({ onNotify }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [saving, setSaving] = useState(false)

  // Add Form state
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'password123',
    departmentId: '',
    specialization: '',
    experienceYears: 5,
    consultationFee: 100,
    qualification: '',
    bio: '',
  })

  // Edit Form state
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    departmentId: '',
    specialization: '',
    experienceYears: 0,
    consultationFee: 0,
    qualification: '',
    bio: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [docs, depts] = await Promise.all([api.getDoctors(), api.getDepartments()])
      setDoctors(docs)
      setDepartments(depts)
      if (depts.length > 0 && !addForm.departmentId) {
        setAddForm((prev) => ({ ...prev, departmentId: depts[0]._id }))
      }
    } catch (err: any) {
      setError(err.message || 'Could not load doctor records.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddDoctor(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.createDoctor({
        name: addForm.name,
        email: addForm.email,
        phone: addForm.phone,
        password: addForm.password,
        departmentId: addForm.departmentId,
        specialization: addForm.specialization,
        experienceYears: Number(addForm.experienceYears),
        consultationFee: Number(addForm.consultationFee),
        qualification: addForm.qualification,
        bio: addForm.bio,
      })
      onNotify(`Doctor ${addForm.name} added successfully with default weekly schedule.`)
      setIsAddOpen(false)
      setAddForm({
        name: '',
        email: '',
        phone: '',
        password: 'password123',
        departmentId: departments[0]?._id || '',
        specialization: '',
        experienceYears: 5,
        consultationFee: 100,
        qualification: '',
        bio: '',
      })
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Could not create doctor account.')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(doctor: Doctor) {
    setEditingDoctor(doctor)
    setEditForm({
      name: doctor.name,
      phone: doctor.phone,
      departmentId: doctor.departmentId || '',
      specialization: doctor.specialization,
      experienceYears: doctor.experienceYears,
      consultationFee: doctor.consultationFee,
      qualification: doctor.qualification || '',
      bio: doctor.bio || '',
    })
  }

  async function handleEditDoctor(e: React.FormEvent) {
    e.preventDefault()
    if (!editingDoctor) return

    setSaving(true)
    setError('')
    try {
      await api.updateDoctor(editingDoctor.id, {
        name: editForm.name,
        phone: editForm.phone,
        departmentId: editForm.departmentId,
        specialization: editForm.specialization,
        experienceYears: Number(editForm.experienceYears),
        consultationFee: Number(editForm.consultationFee),
        qualification: editForm.qualification,
        bio: editForm.bio,
      })
      onNotify(`Profile for ${editForm.name} updated successfully.`)
      setEditingDoctor(null)
      await loadData()
    } catch (err: any) {
      setError(err.message || 'Could not update doctor profile.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteDoctor(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to remove ${name} from the medical staff? This will also remove their schedule.`)) {
      return
    }

    try {
      await api.deleteDoctor(id)
      onNotify(`Doctor ${name} removed from the system.`)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Could not delete doctor.')
    }
  }

  const filteredDoctors = doctors.filter((d) =>
    `${d.name} ${d.specialization} ${d.department}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Medical Staff &amp; Doctors</h1>
          <p className="page-subtitle">Hospital physician roster, department assignments, and consultation fee controls</p>
        </div>
        <button onClick={() => setIsAddOpen(true)} className="btn-primary">
          <PlusIcon size={16} /> Add New Doctor
        </button>
      </div>

      <div className="search-filter-card">
        <div className="search-input-wrapper full-width">
          <span className="search-icon">
            <SearchIcon size={16} color="#64748b" />
          </span>
          <input
            type="text"
            placeholder="Search doctors by name, specialization, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">Loading doctors list...</div>
      ) : filteredDoctors.length > 0 ? (
        <div className="table-responsive card-table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Department</th>
                <th>Specialization &amp; Degrees</th>
                <th>Experience</th>
                <th>Fee</th>
                <th>Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div className="table-cell-bold">{doc.name}</div>
                    <small style={{ color: '#64748b' }}>{doc.email}</small>
                  </td>
                  <td>
                    <span className="table-cell-tag">{doc.department}</span>
                  </td>
                  <td>
                    <div className="table-cell-bold">{doc.specialization}</div>
                    <small style={{ color: '#64748b' }}>{doc.qualification || 'Licensed Physician'}</small>
                  </td>
                  <td>{doc.experienceYears} Years</td>
                  <td>₹{Number(doc.consultationFee).toFixed(0)}</td>
                  <td>{doc.phone || 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => startEdit(doc)}
                        className="btn-secondary btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                        className="btn-danger-outline btn-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={<StethoscopeIcon size={38} color="#94a3b8" />}
          title="No Doctors Found"
          message="No doctors match your search or none have been added yet."
          actionLabel="Add Doctor"
          onAction={() => setIsAddOpen(true)}
        />
      )}

      {/* Add Doctor Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Doctor to Medical Staff"
        subtitle="Create physician profile and system login account"
        maxWidth="650px"
      >
        <form onSubmit={handleAddDoctor} className="custom-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="d-name">Doctor Full Name *</label>
              <input
                id="d-name"
                type="text"
                required
                placeholder="e.g. Dr. Emily Brooks"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="d-email">Login Email *</label>
              <input
                id="d-email"
                type="email"
                required
                placeholder="e.g. emily.brooks@hospital.com"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="d-phone">Phone Number *</label>
              <input
                id="d-phone"
                type="tel"
                required
                placeholder="e.g. 555-0103"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="d-pwd">Initial Login Password *</label>
              <input
                id="d-pwd"
                type="password"
                required
                minLength={6}
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="d-dept">Department *</label>
              <select
                id="d-dept"
                required
                value={addForm.departmentId}
                onChange={(e) => setAddForm({ ...addForm, departmentId: e.target.value })}
                className="form-input"
              >
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="d-spec">Specialization *</label>
              <input
                id="d-spec"
                type="text"
                required
                placeholder="e.g. Orthopedic Surgeon"
                value={addForm.specialization}
                onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="d-exp">Experience (Years) *</label>
              <input
                id="d-exp"
                type="number"
                min={0}
                required
                value={addForm.experienceYears}
                onChange={(e) => setAddForm({ ...addForm, experienceYears: Number(e.target.value) })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="d-fee">Consultation Fee (₹) *</label>
              <input
                id="d-fee"
                type="number"
                min={0}
                step="0.01"
                required
                value={addForm.consultationFee}
                onChange={(e) => setAddForm({ ...addForm, consultationFee: Number(e.target.value) })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="d-qual">Degrees &amp; Qualifications</label>
            <input
              id="d-qual"
              type="text"
              placeholder="e.g. MS (Ortho), FAAOS, Harvard Medical Fellowship"
              value={addForm.qualification}
              onChange={(e) => setAddForm({ ...addForm, qualification: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="d-bio">Physician Bio &amp; Clinical Focus</label>
            <textarea
              id="d-bio"
              rows={3}
              placeholder="Brief summary of professional background, clinical specialties, and patient care philosophy..."
              value={addForm.bio}
              onChange={(e) => setAddForm({ ...addForm, bio: e.target.value })}
              className="form-textarea"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={() => setIsAddOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Creating Doctor Account...' : 'Register Doctor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Doctor Modal */}
      <Modal
        isOpen={Boolean(editingDoctor)}
        onClose={() => setEditingDoctor(null)}
        title="Edit Doctor Profile"
        subtitle={`Update details for ${editingDoctor?.name}`}
        maxWidth="650px"
      >
        <form onSubmit={handleEditDoctor} className="custom-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ed-name">Doctor Full Name *</label>
              <input
                id="ed-name"
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ed-phone">Phone Number *</label>
              <input
                id="ed-phone"
                type="tel"
                required
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ed-dept">Department *</label>
              <select
                id="ed-dept"
                value={editForm.departmentId}
                onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                className="form-input"
              >
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ed-spec">Specialization *</label>
              <input
                id="ed-spec"
                type="text"
                required
                value={editForm.specialization}
                onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ed-exp">Experience (Years) *</label>
              <input
                id="ed-exp"
                type="number"
                min={0}
                required
                value={editForm.experienceYears}
                onChange={(e) => setEditForm({ ...editForm, experienceYears: Number(e.target.value) })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ed-fee">Consultation Fee (₹) *</label>
              <input
                id="ed-fee"
                type="number"
                min={0}
                step="0.01"
                required
                value={editForm.consultationFee}
                onChange={(e) => setEditForm({ ...editForm, consultationFee: Number(e.target.value) })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ed-qual">Degrees &amp; Qualifications</label>
            <input
              id="ed-qual"
              type="text"
              value={editForm.qualification}
              onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="ed-bio">Physician Bio</label>
            <textarea
              id="ed-bio"
              rows={3}
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              className="form-textarea"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={() => setEditingDoctor(null)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
