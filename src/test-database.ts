// Test file to verify HRMS system functionality
// This file tests the database connection and service functions

import { employeeService, attendanceService, payslipService } from './lib/supabase';

export const testDatabase = async () => {
  console.log('🧪 Testing HRMS Database Connection...');
  
  try {
    // Test employee service
    console.log('📊 Testing Employee Service...');
    const employees = await employeeService.getAllEmployees();
    console.log(`✅ Found ${employees.length} employees`);
    
    if (employees.length > 0) {
      const firstEmployee = employees[0];
      console.log(`👤 First Employee: ${firstEmployee.employee_name} (${firstEmployee.emp_code})`);
      
      // Test attendance service
      console.log('📅 Testing Attendance Service...');
      const attendance = await attendanceService.getEmployeeAttendance(firstEmployee.id);
      console.log(`✅ Found ${attendance.length} attendance records for ${firstEmployee.employee_name}`);
      
      // Test attendance summary
      const summary = await attendanceService.getAttendanceSummary('2025-10-01', '2025-10-31');
      console.log(`📈 Attendance Summary: Total: ${summary.total}, Present: ${summary.present}, Absent: ${summary.absent}`);
    }
    
    console.log('🎉 All database tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
};

// Auto-run test when this file is imported
testDatabase();