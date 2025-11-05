-- Complete Daily Attendance Report for October 2025\n-- Generated from ALOG_001 attendance log\n\n-- Insert all employees from log
INSERT INTO employees (card_no, emp_code, employee_name, branch, salary, is_active, created_at, updated_at) 
VALUES 

ON CONFLICT (card_no) DO NOTHING;

-- Oct 1-7, 2025: Mark ALL employees as Present (as requested)
WITH hyderabad_employees AS (
  SELECT id, card_no FROM employees WHERE branch = 'Hyderabad'
),
date_range_1_to_7 AS (
  SELECT generate_series('2025-10-01'::date, '2025-10-07'::date, '1 day'::interval)::date AS attendance_date
)
INSERT INTO attendance (employee_id, attendance_date, status, marked_at, marked_by, created_at)
SELECT 
  he.id,
  dr.attendance_date,
  'present',
  NOW(),
  'system_import',
  NOW()
FROM hyderabad_employees he
CROSS JOIN date_range_1_to_7 dr
WHERE NOT EXISTS (
  SELECT 1 FROM attendance a 
  WHERE a.employee_id = he.id AND a.attendance_date = dr.attendance_date
);

