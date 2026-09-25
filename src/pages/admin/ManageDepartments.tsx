import React, { useState, useEffect } from 'react'
import { api, type Department } from '../../services/api'
import { Modal } from '../../components/Modal'
import { EmptyState } from '../../components/EmptyState'
import { PlusIcon, BuildingIcon } from '../../components/Icons'

interface ManageDepartmentsProps {
  onNotify: (message: string) => void
}

export const ManageDepartments: React.FC<ManageDepartmentsProps> = ({ onNotify }) => {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDepartments()
  }, [])

  async function loadDepartments() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getDepartments()
      setDepartments(data)
    } catch (err: any) {
      setError(err.message || 'Could not load departments.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    setError('')
    try {
      await api.createDepartment({ name: name.trim(), description: description.trim() })
      onNotify(`Department "${name.trim()}" created successfully.`)
      setIsAddOpen(false)
      setName('')
      setDescription('')
      await loadDepartments()
    } catch (err: any) {
      setError(err.message || 'Could not create department.')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(dept: Department) {
    setEditingDept(dept)
    setName(dept.name)
    setDescription(dept.description || '')
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingDept || !name.trim()) return

    setSaving(true)
    setError('')
    try {
      await api.updateDepartment(editingDept._id, { name: name.trim(), description: description.trim() })
      onNotify(`Department updated to "${name.trim()}".`)
      setEditingDept(null)
      setName('')
      setDescription('')
      await loadDepartments()
    } catch (err: any) {
      setError(err.message || 'Could not update department.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, deptName: string) {
    if (!window.confirm(`Are you sure you want to delete "${deptName}"? This is only permitted if no active doctors are assigned to this department.`)) {
      return
    }

    try {
      await api.deleteDepartment(id)
      onNotify(`Department "${deptName}" deleted.`)
      await loadDepartments()
    } catch (err: any) {
      alert(err.message || 'Could not delete department.')
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Clinical Departments</h1>
          <p className="page-subtitle">Configure hospital medical divisions, centers of excellence, and specialty units</p>
        </div>
        <button
          onClick={() => {
            setName('')
            setDescription('')
            setIsAddOpen(true)
          }}
          className="btn-primary"
        >
          <PlusIcon size={16} /> Add Department
        </button>
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {loading ? (
        <div className="loading-container">Loading hospital departments...</div>
      ) : departments.length > 0 ? (
        <div className="table-responsive card-table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Description &amp; Specialty Focus</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d._id}>
                  <td>
                    <div className="table-cell-bold" style={{ fontSize: '1rem', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BuildingIcon size={16} color="#0369a1" />
                      {d.name}
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: '480px', color: '#475569' }}>
                      {d.description || 'General hospital clinical department'}
                    </div>
                  </td>
                  <td>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => startEdit(d)}
                        className="btn-secondary btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(d._id, d.name)}
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
          icon={<BuildingIcon size={38} color="#94a3b8" />}
          title="No Departments Configured"
          message="No hospital departments found. Create your first clinical division."
          actionLabel="Add Department"
          onAction={() => setIsAddOpen(true)}
        />
      )}

      {/* Add / Edit Department Modal */}
      <Modal
        isOpen={isAddOpen || Boolean(editingDept)}
        onClose={() => {
          setIsAddOpen(false)
          setEditingDept(null)
        }}
        title={editingDept ? 'Edit Clinical Department' : 'Create Hospital Department'}
        subtitle="Specify division name and service scope"
        maxWidth="500px"
      >
        <form onSubmit={editingDept ? handleEdit : handleAdd} className="custom-form">
          <div className="form-group">
            <label htmlFor="dept-name">Department Name *</label>
            <input
              id="dept-name"
              type="text"
              required
              placeholder="e.g. Oncology, Ophthalmology, Urology"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dept-desc">Description &amp; Clinical Scope</label>
            <textarea
              id="dept-desc"
              rows={4}
              placeholder="Describe the department's specialties, care therapies, and diagnostic capabilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false)
                setEditingDept(null)
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editingDept ? 'Save Changes' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
