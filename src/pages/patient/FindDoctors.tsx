import React, { useState, useEffect } from 'react'
import { api, type Doctor, type Department } from '../../services/api'
import { BookAppointmentModal } from './BookAppointmentModal'
import { DoctorProfileModal } from './DoctorProfileModal'
import { EmptyState } from '../../components/EmptyState'
import { SearchIcon, StethoscopeIcon } from '../../components/Icons'

interface FindDoctorsProps {
  onNotify: (message: string) => void
}

export const FindDoctors: React.FC<FindDoctorsProps> = ({ onNotify }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modals state
  const [profileDoctorId, setProfileDoctorId] = useState<string | null>(null)
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadDoctors()
  }, [searchTerm, selectedDepartment])

  async function loadInitialData() {
    try {
      const depts = await api.getDepartments()
      setDepartments(depts)
    } catch (err: any) {
      console.warn('Could not load departments filter:', err)
    }
  }

  async function loadDoctors() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getDoctors({
        search: searchTerm,
        department: selectedDepartment,
      })
      setDoctors(data)
    } catch (err: any) {
      setError(err.message || 'Could not load doctors.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Find Hospital Doctors &amp; Specialists</h1>
          <p className="page-subtitle">
            Browse our medical staff, check clinical credentials, and book available appointments
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="search-filter-card">
        <div className="search-input-wrapper">
          <span className="search-icon">
            <SearchIcon size={16} color="#64748b" />
          </span>
          <input
            type="text"
            placeholder="Search by doctor name, specialization, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-dropdown-wrapper">
          <label htmlFor="dept-filter" className="filter-label">Department:</label>
          <select
            id="dept-filter"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="filter-select"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="form-alert-error">{error}</div>}

      {/* Doctor Grid */}
      {loading ? (
        <div className="loading-container">Searching medical staff...</div>
      ) : doctors.length > 0 ? (
        <div className="doctor-cards-grid">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="doctor-card">
              <div className="doctor-card-top">
                <div className="doctor-avatar">
                  {doctor.name.replace('Dr. ', '').slice(0, 2).toUpperCase()}
                </div>
                <div className="doctor-badge-department">{doctor.department}</div>
              </div>

              <div className="doctor-card-body">
                <h3 className="doctor-card-name">{doctor.name}</h3>
                <div className="doctor-card-specialty">{doctor.specialization}</div>
                <div className="doctor-card-qual">{doctor.qualification || 'Consultant'}</div>

                <div className="doctor-card-stats">
                  <div className="stat-item">
                    <span className="stat-label">Experience</span>
                    <span className="stat-val">{doctor.experienceYears} Years</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Consultation</span>
                    <span className="stat-val">₹{Number(doctor.consultationFee).toFixed(0)}</span>
                  </div>
                </div>

                <p className="doctor-card-bio">
                  {doctor.bio
                    ? doctor.bio.length > 95
                      ? `${doctor.bio.slice(0, 95)}...`
                      : doctor.bio
                    : 'Specialist physician available for routine and specialty consultations.'}
                </p>
              </div>

              <div className="doctor-card-footer">
                <button
                  type="button"
                  onClick={() => setProfileDoctorId(doctor.id)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  View Profile
                </button>
                <button
                  type="button"
                  onClick={() => setBookingDoctor(doctor)}
                  className="btn-primary"
                  style={{ flex: 1.2 }}
                >
                  Book Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<StethoscopeIcon size={38} color="#94a3b8" />}
          title="No Doctors Found"
          message="No doctors match your search or department filter. Try clearing the filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchTerm('')
            setSelectedDepartment('')
          }}
        />
      )}

      {/* Doctor Profile Modal */}
      <DoctorProfileModal
        doctorId={profileDoctorId}
        isOpen={Boolean(profileDoctorId)}
        onClose={() => setProfileDoctorId(null)}
        onBookClick={(doc) => setBookingDoctor(doc)}
      />

      {/* Book Appointment Modal */}
      <BookAppointmentModal
        doctor={bookingDoctor}
        isOpen={Boolean(bookingDoctor)}
        onClose={() => setBookingDoctor(null)}
        onSuccess={(msg) => onNotify(msg)}
      />
    </div>
  )
}
