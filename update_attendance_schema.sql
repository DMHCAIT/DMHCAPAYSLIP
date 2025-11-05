-- Database Schema Update Script for Enhanced Attendance System
-- Run this to update existing attendance table to support new statuses

-- First, let's check current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'attendance' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Update the attendance table constraint to include new statuses
ALTER TABLE attendance 
DROP CONSTRAINT IF EXISTS attendance_status_check;

-- Check if constraint exists first
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE constraint_name LIKE '%status%' AND table_name = 'attendance') THEN
        EXECUTE 'ALTER TABLE attendance DROP CONSTRAINT ' || (
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE constraint_type = 'CHECK' 
                AND table_name = 'attendance' 
                AND constraint_name LIKE '%status%'
            LIMIT 1
        );
    END IF;
END $$;

-- Add the new constraint
ALTER TABLE attendance 
ADD CONSTRAINT attendance_status_check 
CHECK (status IN ('present', 'absent', 'half_day', 'late', 'week_off', 'holiday'));

-- Add new columns if they don't exist
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS in_time TIME,
ADD COLUMN IF NOT EXISTS out_time TIME,
ADD COLUMN IF NOT EXISTS total_hours DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS marked_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Clean up any existing conflicting data first
DELETE FROM attendance WHERE attendance_date >= CURRENT_DATE - INTERVAL '1 day';

-- Insert sample attendance data with proper data types
-- Yesterday's data
INSERT INTO attendance (employee_id, attendance_date, status, in_time, out_time, total_hours, marked_by) 
SELECT 
    e.id,
    CURRENT_DATE - INTERVAL '1 day',
    (ARRAY['present', 'absent', 'half_day', 'late'])[1 + floor(random() * 4)::int],
    CASE 
        WHEN random() < 0.7 THEN TIME '09:00:00'
        ELSE NULL
    END,
    CASE 
        WHEN random() < 0.7 THEN TIME '18:00:00'
        ELSE NULL  
    END,
    CASE 
        WHEN random() < 0.7 THEN 8.0
        ELSE NULL
    END,
    'System Auto-Generated'
FROM employees e
WHERE e.is_active = true
LIMIT 10
ON CONFLICT (employee_id, attendance_date) DO UPDATE SET
    status = EXCLUDED.status,
    in_time = EXCLUDED.in_time,
    out_time = EXCLUDED.out_time,
    total_hours = EXCLUDED.total_hours,
    marked_by = EXCLUDED.marked_by;

-- Today's sample data  
INSERT INTO attendance (employee_id, attendance_date, status, in_time, out_time, total_hours, marked_by) 
SELECT 
    e.id,
    CURRENT_DATE,
    (ARRAY['present', 'absent', 'half_day', 'late'])[1 + floor(random() * 4)::int],
    CASE 
        WHEN random() < 0.6 THEN TIME '09:00:00'
        ELSE NULL
    END,
    CASE 
        WHEN random() < 0.6 THEN TIME '18:00:00'
        ELSE NULL
    END,
    CASE 
        WHEN random() < 0.6 THEN 8.0
        ELSE NULL
    END,
    'System Auto-Generated'
FROM employees e
WHERE e.is_active = true
LIMIT 10
ON CONFLICT (employee_id, attendance_date) DO UPDATE SET
    status = EXCLUDED.status,
    in_time = EXCLUDED.in_time,
    out_time = EXCLUDED.out_time,
    total_hours = EXCLUDED.total_hours,
    marked_by = EXCLUDED.marked_by;

-- Display results
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN status = 'half_day' THEN 1 END) as half_day_count,
    COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count
FROM attendance 
WHERE attendance_date >= CURRENT_DATE - INTERVAL '1 day';

COMMIT;