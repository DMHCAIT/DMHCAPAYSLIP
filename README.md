# HRMS Pro - Professional Human Resource Management System

A comprehensive, modern HRMS built with React, TypeScript, Tailwind CSS, and Supabase for efficient employee management, attendance tracking, and payroll processing.

## 🚀 Features

### 📊 **Dashboard Analytics**
- Real-time employee statistics
- Attendance overview and trends
- Department-wise analytics
- Quick action buttons

### 👥 **Employee Management**
- Complete employee database with 52+ records
- Employee profiles with card numbers and codes
- Branch-wise organization (Hyderabad & Delhi)
- Add, edit, and manage employee information

### ⏰ **Attendance System**
- Biometric attendance import from ALOG_001.txt
- 755+ attendance records (Oct 8-31, 2025)
- Individual employee attendance calendars
- Bulk attendance marking
- Attendance status tracking (Present/Absent/Week Off)

### 💰 **Payslip Generation**
- Automated salary calculations
- Per-day salary computation
- Deductions and allowances
- Pay cycle management
- Payslip export capabilities

### 📈 **Reports & Analytics**
- Attendance reports
- Payroll summaries
- Employee performance metrics
- Export functionality

## 🛠️ Technology Stack

- **Frontend**: React 18.3.1 + TypeScript + Vite 5.4.8
- **Styling**: Tailwind CSS 3.4.1 + Lucide React Icons
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel/Netlify Ready

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone the Repository
```bash
git clone <repository-url>
cd pay-main
npm install
```

### 2. Environment Configuration
Copy the `.env.example` to `.env` and configure:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
Execute the database setup script in your Supabase SQL editor:

```bash
# Run the database setup script
# Copy and execute the contents of database_setup.sql in Supabase
```

This will create:
- ✅ All necessary tables (employees, attendance, payslips, etc.)
- ✅ Sample employee data (52 employees)
- ✅ Database indexes for performance
- ✅ Row Level Security policies
- ✅ Automated triggers

### 4. Import Attendance Data
```bash
# Execute attendance_import.sql in Supabase to import
# 755 attendance records from ALOG_001.txt biometric logs
```

### 5. Start Development Server
```bash
npm run dev
```

Visit: `http://localhost:5173`

## 🏗️ Database Schema

### **Employees Table**
```sql
- id (UUID, Primary Key)
- card_no (VARCHAR, Unique)
- emp_code (VARCHAR, Unique)
- employee_name (VARCHAR)
- branch (VARCHAR)
- salary (DECIMAL)
- position (VARCHAR)
- department (VARCHAR)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### **Attendance Table**
```sql
- id (UUID, Primary Key)
- employee_id (UUID, Foreign Key)
- attendance_date (DATE)
- status (VARCHAR: present/absent/week_off)
- in_time (TIME)
- out_time (TIME)
- total_hours (DECIMAL)
- marked_by (VARCHAR)
- created_at (TIMESTAMP)
```

### **Payslips Table**
```sql
- id (UUID, Primary Key)
- employee_id (UUID, Foreign Key)
- pay_cycle_start (DATE)
- pay_cycle_end (DATE)
- base_salary (DECIMAL)
- present_days (INTEGER)
- absent_days (INTEGER)
- gross_salary (DECIMAL)
- deductions (DECIMAL)
- net_salary (DECIMAL)
- status (VARCHAR: draft/approved/paid)
- created_at (TIMESTAMP)
```

## 🎯 Usage Guide

### **Dashboard Navigation**
1. **Dashboard** - Overview and statistics
2. **Employees** - Manage employee records
3. **Attendance** - Track and manage attendance
4. **Payslips** - Generate and manage payslips
5. **Reports** - Analytics and reporting
6. **Settings** - System configuration

### **Employee Management**
- View all 52 employees across Hyderabad and Delhi branches
- Add new employees with complete information
- Update existing employee details
- Track employee status and salary information

### **Attendance Management**
- **Import Data**: Import biometric attendance from ALOG_001.txt
- **View Calendar**: Individual employee attendance calendars
- **Mark Attendance**: Bulk attendance marking for multiple employees
- **Status Tracking**: Monitor daily attendance statistics

### **Payslip Generation**
- Select employee and pay period
- Auto-calculate based on attendance
- Generate comprehensive payslips
- Track payment status

## 🔧 API Services

The application includes comprehensive database services:

### **Employee Service**
- `getAllEmployees()` - Fetch all employees
- `getEmployeeById(id)` - Get specific employee
- `addEmployee(employee)` - Add new employee
- `updateEmployee(id, updates)` - Update employee
- `deleteEmployee(id)` - Remove employee

### **Attendance Service**
- `getEmployeeAttendance(employeeId, startDate, endDate)` - Get attendance records
- `markAttendance(employeeId, date, status)` - Mark attendance
- `getAttendanceSummary(startDate, endDate)` - Get attendance statistics

### **Payslip Service**
- `generatePayslip(employeeId, startDate, endDate)` - Generate payslip
- `getEmployeePayslips(employeeId)` - Get employee payslips

## 📁 Project Structure

```
src/
├── components/
│   ├── AttendanceCalendar.tsx    # Individual attendance calendar
│   ├── AttendanceImport.tsx      # Biometric data import
│   ├── Dashboard.tsx             # Main dashboard
│   ├── EmployeeList.tsx          # Employee management
│   └── PayslipGenerator.tsx      # Payslip generation
├── lib/
│   └── supabase.ts              # Database services & configuration
├── utils/
│   └── payslipCalculations.ts   # Salary calculation utilities
└── App.tsx                      # Main application component
```

## 🚀 Production Deployment

### **Build for Production**
```bash
npm run build
```

### **Deploy to Vercel**
```bash
npm install -g vercel
vercel --prod
```

### **Deploy to Netlify**
```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🔐 Security Features

- ✅ Row Level Security (RLS) enabled
- ✅ Authenticated user access only
- ✅ Secure API endpoints
- ✅ Environment variable protection
- ✅ Input validation and sanitization

## 📊 Sample Data Included

- **52 Employees**: Complete employee records with card numbers and codes
- **755 Attendance Records**: October 8-31, 2025 attendance data
- **2 Branches**: Hyderabad (26 employees) and Delhi (26 employees)
- **Real Biometric Data**: Imported from ALOG_001.txt

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Support

For support and questions:
- Create an issue in the repository
- Contact: support@hrms-pro.com

---

**HRMS Pro** - Streamlining Human Resource Management with Modern Technology 🚀
