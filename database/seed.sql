USE hospital_management;

INSERT INTO departments (name, description) VALUES
('Cardiology', 'Heart and cardiovascular care'),
('Neurology', 'Brain and nervous system care'),
('Orthopedics', 'Bones, joints and movement care'),
('General Medicine', 'Everyday primary care');

-- Password for all development users: password
INSERT INTO users (name, email, password_hash, role, phone) VALUES
('Jordan Davis', 'admin@northstar.health', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', '555-0100'),
('Dr. Sarah Wilson', 'sarah.wilson@northstar.health', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', '555-0101'),
('Dr. Michael Chen', 'michael.chen@northstar.health', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'doctor', '555-0102'),
('Olivia Bennett', 'olivia.bennett@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'patient', '555-0103');

INSERT INTO patients (user_id, date_of_birth, gender, blood_group) VALUES (4, '1994-04-16', 'Female', 'O+');
INSERT INTO doctors (user_id, department_id, specialization, experience_years, consultation_fee, qualification, bio) VALUES
(2, 1, 'Cardiologist', 12, 120.00, 'MD, FACC', 'Specializes in preventive cardiology and heart health.'),
(3, 2, 'Neurologist', 9, 105.00, 'MD, FAAN', 'Focuses on migraine, sleep and general neurology.');
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration) VALUES
(1, 1, '09:00:00', '13:00:00', 30), (1, 3, '09:00:00', '13:00:00', 30),
(2, 2, '14:00:00', '18:00:00', 30), (2, 4, '14:00:00', '18:00:00', 30);