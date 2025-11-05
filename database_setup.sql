-- HRMS Database Setup Script
-- This script creates all necessary tables for the HRMS system

-- Enable Row Level Security
-- This ensures data security at the database level
SET search_path TO public;

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_no VARCHAR(20) UNIQUE,
    emp_code VARCHAR(20) UNIQUE NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    salary DECIMAL(10,2) DEFAULT 0,
    position VARCHAR(100),
    department VARCHAR(50),
    hire_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table with all supported statuses
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('present', 'absent', 'half_day', 'late', 'week_off', 'holiday')) DEFAULT 'absent',
    in_time TIME,
    out_time TIME,
    total_hours DECIMAL(4,2),
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    marked_by VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, attendance_date)
);

-- Create payslips table
CREATE TABLE IF NOT EXISTS payslips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    pay_cycle_start DATE NOT NULL,
    pay_cycle_end DATE NOT NULL,
    credit_date DATE,
    base_salary DECIMAL(10,2) NOT NULL,
    working_days INTEGER DEFAULT 0,
    present_days INTEGER DEFAULT 0,
    absent_days INTEGER DEFAULT 0,
    per_day_salary DECIMAL(10,2) DEFAULT 0,
    gross_salary DECIMAL(10,2) DEFAULT 0,
    allowances DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(10,2) DEFAULT 0,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) CHECK (status IN ('draft', 'approved', 'paid')) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leaves table
CREATE TABLE IF NOT EXISTS leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    head_id UUID REFERENCES employees(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employee_documents table
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(200) NOT NULL,
    document_url TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_emp_code ON employees(emp_code);
CREATE INDEX IF NOT EXISTS idx_employees_card_no ON employees(card_no);
CREATE INDEX IF NOT EXISTS idx_employees_branch ON employees(branch);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_payslips_employee ON payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON payslips(pay_cycle_start, pay_cycle_end);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at 
    BEFORE UPDATE ON employees 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payslips_updated_at ON payslips;
CREATE TRIGGER update_payslips_updated_at 
    BEFORE UPDATE ON payslips 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample employees data (converting to UUID)
INSERT INTO employees (id, card_no, emp_code, employee_name, branch, salary, is_active, created_at, updated_at) 
VALUES 
    (gen_random_uuid(), '00000001', 'HYD0001', 'mahender', 'Hyderabad', 22000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000002', 'HYD0002', 'nakshatra', 'Hyderabad', 28600, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000003', 'HYD0003', 'mehraj', 'Hyderabad', 27600, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000004', 'HYD0004', 'aqeel', 'Hyderabad', 25000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000005', 'HYD0005', 'yaseen', 'Hyderabad', 18000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000006', 'HYD0006', 'rafat', 'Hyderabad', 35000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000007', 'HYD0007', 'srilakshmi', 'Hyderabad', 23500, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000008', 'HYD0008', 'mirza', 'Hyderabad', 20000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000009', 'HYD0009', 'shankar', 'Hyderabad', 40000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000010', 'HYD0010', 'alekhya', 'Hyderabad', 22500, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000011', 'HYD0011', 'hussain', 'Hyderabad', 27000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000012', 'HYD0012', 'bhavani', 'Hyderabad', 25000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000013', 'HYD0013', 'khushi', 'Hyderabad', 22000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000014', 'HYD0014', 'nikhil', 'Hyderabad', 66000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000015', 'HYD0015', 'shivam', 'Hyderabad', 25000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000016', 'HYD0016', 'akram', 'Hyderabad', 70000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000017', 'HYD0017', 'moin', 'Hyderabad', 86900, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000018', 'HYD0018', 'vijayasree', 'Hyderabad', 18000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000019', 'HYD0019', 'rajitha', 'Hyderabad', 11000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000020', 'HYD0020', 'aslamali', 'Hyderabad', 25000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000021', 'HYD0021', 'satish', 'Hyderabad', 30000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000022', 'HYD0022', 'roshan', 'Hyderabad', 17000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '00000023', 'HYD0023', 'akshay', 'Hyderabad', 27000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '', '', 'susheela', 'Hyderabad', 10000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '', '', 'tejashree', 'Hyderabad', 20000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '', '', 'asiya', 'Hyderabad', 37000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '37', 'DEL0037', 'sajid', 'Delhi', 43000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '1745', 'DEL1745', 'anju', 'Delhi', 12650, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '870', 'DEL0870', 'sajid it', 'Delhi', 11000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '4606', 'DEL4606', 'irfan', 'Delhi', 17000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '2298', 'DEL2298', 'abhishek', 'Delhi', 30000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '5177', 'DEL5177', 'shaikh', 'Delhi', 11500, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '3999', 'DEL3999', 'nazim', 'Delhi', 28000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '4604', 'DEL4604', 'poonam', 'Delhi', 20000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '3091', 'DEL3091', 'sohail', 'Delhi', 10000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '3093', 'DEL3093', 'meekad', 'Delhi', 50000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '4402', 'DEL4402', 'shagun', 'Delhi', 50000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '2362', 'DEL2362', 'loveleen', 'Delhi', 24200, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '6231', 'DEL6231', 'momin', 'Delhi', 20000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '2782', 'DEL2782', 'rabiya', 'Delhi', 15000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '6469', 'DEL6469', 'fasiuddin', 'Delhi', 45000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '2645', 'DEL2645', 'sahil', 'Delhi', 10000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '6820', 'DEL6820', 'lahareesh', 'Delhi', 18000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '2644', 'DEL2644', 'iqrar', 'Delhi', 15000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '9218', 'DEL9218', 'shilpi', 'Delhi', 12000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '6520', 'DEL6520', 'keshav', 'Delhi', 20000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '7719', 'DEL7719', 'rajesh', 'Delhi', 30000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '5020', 'DEL5020', 'avnisha', 'Delhi', 25000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '120', 'DEL0120', 'manisha', 'Delhi', 12000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '7135', 'DEL7135', 'ashwani', 'Delhi', 27000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '9904', 'DEL9904', 'soniya', 'Delhi', 22000, true, '2025-01-01', '2025-01-01'),
    (gen_random_uuid(), '5395', 'DEL5395', 'santhosh', 'Delhi', 40000, true, '2025-01-01', '2025-01-01')
ON CONFLICT (emp_code) DO NOTHING;

-- Insert sample departments
INSERT INTO departments (name, description, is_active) VALUES 
    ('Human Resources', 'Managing employee relations and policies', true),
    ('Information Technology', 'Technology and software development', true),
    ('Finance', 'Financial management and accounting', true),
    ('Operations', 'Daily operations and logistics', true),
    ('Sales', 'Sales and customer relations', true)
ON CONFLICT (name) DO NOTHING;

-- Create Row Level Security policies (Optional - for multi-tenant security)
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON employees TO anon, authenticated;
GRANT ALL ON attendance TO anon, authenticated;
GRANT ALL ON payslips TO anon, authenticated;
GRANT ALL ON leaves TO anon, authenticated;
GRANT ALL ON departments TO anon, authenticated;
GRANT ALL ON employee_documents TO anon, authenticated;

-- Success message
SELECT 'HRMS Database setup completed successfully!' as status;