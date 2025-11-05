const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Supabase anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// Employee data from the attendance log
const employees = [
  { emp_code: '00000001', name: 'mahender' },
  { emp_code: '00000002', name: 'nakshatra' },
  { emp_code: '00000003', name: 'mehraj' },
  { emp_code: '00000004', name: 'aqeel' },
  { emp_code: '00000005', name: 'yaseen' },
  { emp_code: '00000006', name: 'rafat' },
  { emp_code: '00000007', name: 'srilakshmi' },
  { emp_code: '00000008', name: 'mirza' },
  { emp_code: '00000009', name: 'shankar' },
  { emp_code: '00000010', name: 'alekhya' },
  { emp_code: '00000011', name: 'hussain' },
  { emp_code: '00000012', name: 'bhavani' },
  { emp_code: '00000013', name: 'khushi' },
  { emp_code: '00000014', name: 'nikhil' },
  { emp_code: '00000015', name: 'shivam' },
  { emp_code: '00000016', name: 'akram' },
  { emp_code: '00000017', name: 'moin' },
  { emp_code: '00000018', name: 'vijayasree' },
  { emp_code: '00000019', name: 'rajitha' },
  { emp_code: '00000020', name: 'aslamali' }
];

// Function to generate date range
function generateDateRange(startDate, endDate) {
  const dates = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);
  
  while (currentDate <= end) {
    dates.push(new Date(currentDate).toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

// Function to get employee ID from database
async function getEmployeeId(empCode) {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('id')
      .eq('emp_code', empCode)
      .single();
    
    if (error) {
      console.error(`Error finding employee with code ${empCode}:`, error);
      return null;
    }
    
    return data?.id;
  } catch (error) {
    console.error(`Error getting employee ID for ${empCode}:`, error);
    return null;
  }
}

// Function to insert attendance record
async function insertAttendanceRecord(employeeId, attendanceDate, status, inTime = null, outTime = null) {
  try {
    const attendanceRecord = {
      employee_id: employeeId,
      attendance_date: attendanceDate,
      status: status,
      in_time: inTime,
      out_time: outTime,
      marked_at: new Date().toISOString(),
      marked_by: 'system_import'
    };

    // Check if record already exists
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('attendance_date', attendanceDate)
      .single();

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('attendance')
        .update(attendanceRecord)
        .eq('id', existing.id);
      
      if (error) {
        console.error(`Error updating attendance for employee ${employeeId} on ${attendanceDate}:`, error);
      } else {
        console.log(`✅ Updated attendance for employee ${employeeId} on ${attendanceDate}: ${status}`);
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('attendance')
        .insert([attendanceRecord]);
      
      if (error) {
        console.error(`Error inserting attendance for employee ${employeeId} on ${attendanceDate}:`, error);
      } else {
        console.log(`✅ Inserted attendance for employee ${employeeId} on ${attendanceDate}: ${status}`);
      }
    }
  } catch (error) {
    console.error(`Error processing attendance record:`, error);
  }
}

// Main function to process attendance data
async function processAttendanceData() {
  console.log('🚀 Starting attendance data import...\n');

  try {
    // Get all employees from Hyderabad branch
    console.log('📊 Fetching Hyderabad branch employees from database...');
    const { data: hyderabadEmployees, error: empError } = await supabase
      .from('employees')
      .select('id, emp_code, employee_name, branch')
      .eq('branch', 'hyderabad');

    if (empError) {
      console.error('❌ Error fetching employees:', empError);
      return;
    }

    if (!hyderabadEmployees || hyderabadEmployees.length === 0) {
      console.log('⚠️ No employees found in Hyderabad branch. Creating sample employees...');
      
      // Create sample employees for demonstration
      for (const emp of employees) {
        const { error: insertError } = await supabase
          .from('employees')
          .insert([{
            emp_code: emp.emp_code,
            employee_name: emp.name,
            branch: 'hyderabad',
            salary: 25000,
            position: 'Staff'
          }]);
        
        if (insertError) {
          console.error(`Error creating employee ${emp.name}:`, insertError);
        } else {
          console.log(`✅ Created employee: ${emp.name} (${emp.emp_code})`);
        }
      }

      // Re-fetch employees
      const { data: newEmployees } = await supabase
        .from('employees')
        .select('id, emp_code, employee_name, branch')
        .eq('branch', 'hyderabad');
      
      hyderabadEmployees.splice(0, 0, ...newEmployees);
    }

    console.log(`\n👥 Found ${hyderabadEmployees.length} employees in Hyderabad branch\n`);

    // Process attendance for 1/10/2025 to 8/10/2025 (Mark all as Present)
    console.log('📅 Processing attendance from 1/10/2025 to 8/10/2025 (All Present)...');
    const presentDates = generateDateRange('2025-10-01', '2025-10-08');
    
    for (const date of presentDates) {
      console.log(`\n📆 Processing date: ${date}`);
      
      for (const employee of hyderabadEmployees) {
        await insertAttendanceRecord(
          employee.id,
          date,
          'present',
          '09:00:00', // Standard in time
          '18:00:00'  // Standard out time
        );
      }
    }

    // Process attendance for 9/10/2025 to 31/10/2025 (Based on actual data from file)
    console.log('\n📅 Processing attendance from 9/10/2025 to 31/10/2025 (Based on log data)...');
    
    // Parse the actual attendance data from the log file
    const logFilePath = '/Users/rubeenakhan/Downloads/ALOG_001 (1).txt';
    
    if (fs.existsSync(logFilePath)) {
      console.log('📂 Reading attendance log file...');
      const fileContent = fs.readFileSync(logFilePath, 'utf8');
      const lines = fileContent.split('\n');
      
      // Parse attendance records from the file
      const attendanceRecords = {};
      
      for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = line.split('\t');
        if (columns.length >= 10) {
          const empCode = columns[2];
          const empName = columns[3];
          const inOut = columns[6];
          const dateTime = columns[9];
          
          if (dateTime && dateTime.includes('2025-10-')) {
            const date = dateTime.split(' ')[0];
            const time = dateTime.split(' ')[1];
            
            // Only process dates from 9th onwards
            const dateObj = new Date(date);
            const startProcessing = new Date('2025-10-09');
            
            if (dateObj >= startProcessing) {
              if (!attendanceRecords[empCode]) {
                attendanceRecords[empCode] = {};
              }
              
              if (!attendanceRecords[empCode][date]) {
                attendanceRecords[empCode][date] = { inTime: null, outTime: null };
              }
              
              if (inOut === 'DutyOn') {
                attendanceRecords[empCode][date].inTime = time;
              } else if (inOut === 'DutyOff') {
                attendanceRecords[empCode][date].outTime = time;
              }
            }
          }
        }
      }
      
      // Process the parsed attendance data
      console.log('\n📊 Processing parsed attendance records...');
      
      const processedDates = generateDateRange('2025-10-09', '2025-10-31');
      
      for (const date of processedDates) {
        console.log(`\n📆 Processing date: ${date}`);
        
        for (const employee of hyderabadEmployees) {
          const empRecord = attendanceRecords[employee.emp_code];
          
          if (empRecord && empRecord[date]) {
            // Employee has attendance record for this date
            const { inTime, outTime } = empRecord[date];
            
            if (inTime && outTime) {
              // Full day present
              await insertAttendanceRecord(employee.id, date, 'present', inTime, outTime);
            } else if (inTime) {
              // Only check-in (might be late or half day)
              const inHour = parseInt(inTime.split(':')[0]);
              if (inHour >= 10) {
                await insertAttendanceRecord(employee.id, date, 'late', inTime, null);
              } else {
                await insertAttendanceRecord(employee.id, date, 'half_day', inTime, null);
              }
            } else {
              // Only check-out (unusual case)
              await insertAttendanceRecord(employee.id, date, 'half_day', null, outTime);
            }
          } else {
            // No record found, mark as absent
            await insertAttendanceRecord(employee.id, date, 'absent');
          }
        }
      }
    } else {
      console.log('⚠️ Log file not found, marking all as present for 9/10/2025 to 31/10/2025...');
      
      // Fallback: mark all as present if log file not found
      const fallbackDates = generateDateRange('2025-10-09', '2025-10-31');
      
      for (const date of fallbackDates) {
        console.log(`\n📆 Processing date: ${date}`);
        
        for (const employee of hyderabadEmployees) {
          await insertAttendanceRecord(
            employee.id,
            date,
            'present',
            '09:30:00',
            '18:00:00'
          );
        }
      }
    }

    console.log('\n🎉 Attendance data import completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Oct 1-8: All employees marked as Present`);
    console.log(`   • Oct 9-31: Attendance based on log data or marked as Present`);
    console.log(`   • Total employees processed: ${hyderabadEmployees.length}`);
    console.log(`   • Branch: Hyderabad`);

  } catch (error) {
    console.error('❌ Error processing attendance data:', error);
  }
}

// Run the import
if (require.main === module) {
  processAttendanceData()
    .then(() => {
      console.log('\n✅ Process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Process failed:', error);
      process.exit(1);
    });
}

module.exports = { processAttendanceData };