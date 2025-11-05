-- ========================================
-- SUPABASE DATABASE SETUP SCRIPT
-- ========================================
-- Run this FIRST in Supabase SQL Editor before importing attendance data

-- Create employees table
CREATE TABLE IF NOT EXISTS public.employees (
    id BIGSERIAL PRIMARY KEY,
    card_no VARCHAR(20) UNIQUE NOT NULL,
    emp_code VARCHAR(20) UNIQUE NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    branch VARCHAR(50) NOT NULL DEFAULT 'Hyderabad',
    salary INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES public.employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'half_day', 'week_off')),
    marked_at TIMESTAMP WITH TIME ZONE,
    marked_by VARCHAR(50) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, attendance_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_card_no ON public.employees(card_no);
CREATE INDEX IF NOT EXISTS idx_employees_emp_code ON public.employees(emp_code);
CREATE INDEX IF NOT EXISTS idx_employees_branch ON public.employees(branch);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Enable read access for all users" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.employees FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.attendance FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.attendance FOR DELETE USING (true);

-- Success message
SELECT 'Database tables created successfully! You can now run the attendance import script.' as status;