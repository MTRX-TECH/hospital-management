CREATE DATABASE IF NOT EXISTS hospital_management;
USE hospital_management;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('patient', 'doctor', 'admin') NOT NULL DEFAULT 'patient',
  phone VARCHAR(30) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE patients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  date_of_birth DATE,
  gender VARCHAR(30),
  blood_group VARCHAR(10),
  address VARCHAR(255),
  emergency_contact VARCHAR(120),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_patient_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE doctors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  department_id INT NOT NULL,
  specialization VARCHAR(120) NOT NULL,
  experience_years INT NOT NULL DEFAULT 0,
  consultation_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  qualification VARCHAR(160),
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_doctor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_doctor_department FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE doctor_schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  doctor_id INT NOT NULL,
  day_of_week TINYINT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration INT NOT NULL DEFAULT 30,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY unique_doctor_day_time (doctor_id, day_of_week, start_time, end_time),
  CONSTRAINT fk_schedule_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

CREATE TABLE appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason VARCHAR(500) NOT NULL,
  status ENUM('REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'REQUESTED',
  active_slot TINYINT AS (status <> 'CANCELLED') STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_active_slot (doctor_id, appointment_date, appointment_time, active_slot),
  INDEX appointment_patient_date (patient_id, appointment_date),
  INDEX appointment_doctor_date (doctor_id, appointment_date),
  CONSTRAINT fk_appointment_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT fk_appointment_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

CREATE TABLE visit_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  appointment_id INT NOT NULL UNIQUE,
  doctor_id INT NOT NULL,
  patient_id INT NOT NULL,
  diagnosis_summary VARCHAR(500),
  doctor_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_visit_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
  CONSTRAINT fk_visit_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  CONSTRAINT fk_visit_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message VARCHAR(500) NOT NULL,
  type VARCHAR(40) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX notification_user_read (user_id, is_read),
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);