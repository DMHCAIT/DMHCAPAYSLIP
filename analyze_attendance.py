#!/usr/bin/env python3
"""
Daily Attendance Report Generator
Analyzes ALOG_001.txt file and creates day-by-day attendance records
"""

import csv
import json
from datetime import datetime, date
from collections import defaultdict

def analyze_attendance_log(file_path):
    daily_attendance = defaultdict(set)  # date -> set of employee_ids who had DutyOn
    all_employees = {}  # employee_id -> name
    
    print("Analyzing attendance log file...")
    
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
        reader = csv.DictReader(file, delimiter='\t')
        
        for row in reader:
            try:
                emp_id = row['EnNo'].strip()
                emp_name = row['Name'].strip()
                in_out = row['In/Out'].strip()
                datetime_str = row['DateTime'].strip()
                
                # Store employee info
                all_employees[emp_id] = emp_name
                
                # Extract date
                date_part = datetime_str.split(' ')[0]
                
                # If it's a DutyOn entry, mark as present
                if in_out == 'DutyOn':
                    daily_attendance[date_part].add(emp_id)
                    
            except Exception as e:
                print(f"Error processing row: {e}")
                continue
    
    return daily_attendance, all_employees

def generate_daily_reports(daily_attendance, all_employees):
    """Generate day-by-day attendance reports"""
    
    print("\n=== DAILY ATTENDANCE ANALYSIS ===\n")
    
    # Get all dates and sort them
    all_dates = sorted(daily_attendance.keys())
    
    # Get all employee IDs for reference
    all_emp_ids = sorted(all_employees.keys())
    
    daily_reports = {}
    
    for current_date in all_dates:
        present_employees = daily_attendance[current_date]
        absent_employees = set(all_emp_ids) - present_employees
        
        # Determine day of week
        try:
            date_obj = datetime.strptime(current_date, '%Y-%m-%d').date()
            day_of_week = date_obj.strftime('%A')
            is_weekend = day_of_week in ['Saturday', 'Sunday']
        except:
            day_of_week = "Unknown"
            is_weekend = False
        
        daily_reports[current_date] = {
            'date': current_date,
            'day_of_week': day_of_week,
            'is_weekend': is_weekend,
            'present_employees': list(present_employees),
            'absent_employees': list(absent_employees),
            'present_count': len(present_employees),
            'absent_count': len(absent_employees),
            'total_employees': len(all_emp_ids)
        }
        
        print(f"📅 {current_date} ({day_of_week})")
        print(f"   Present: {len(present_employees)}/{len(all_emp_ids)} employees")
        
        if present_employees:
            present_names = [f"{emp_id}({all_employees[emp_id]})" for emp_id in sorted(present_employees)]
            print(f"   ✅ Present: {', '.join(present_names)}")
        
        if absent_employees:
            absent_names = [f"{emp_id}({all_employees[emp_id]})" for emp_id in sorted(absent_employees)]
            print(f"   ❌ Absent: {', '.join(absent_names)}")
        
        print()
    
    return daily_reports

def generate_sql_insert_statements(daily_reports, all_employees):
    """Generate SQL INSERT statements for each day"""
    
    print("\n=== SQL INSERT STATEMENTS FOR DAILY ATTENDANCE ===\n")
    
    sql_statements = []
    
    # First, generate employee insert statements
    employee_inserts = []
    for emp_id, emp_name in sorted(all_employees.items()):
        emp_code = f"HYD{emp_id}"
        salary = 25000  # Default salary, adjust as needed
        
        employee_inserts.append(f"""  ('{emp_id}', '{emp_code}', '{emp_name}', 'Hyderabad', {salary}, true, NOW(), NOW())""")
    
    employees_sql = f"""-- Insert all employees from log
INSERT INTO employees (card_no, emp_code, employee_name, branch, salary, is_active, created_at, updated_at) 
VALUES 
{',\\n'.join(employee_inserts)}
ON CONFLICT (card_no) DO NOTHING;

"""
    sql_statements.append(employees_sql)
    
    # Generate daily attendance for October 1-7 (mark all present as requested)
    oct_1_7_sql = """-- Oct 1-7, 2025: Mark ALL employees as Present (as requested)
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

"""
    sql_statements.append(oct_1_7_sql)
    
    # Generate attendance for each day with actual data
    for date_str, report in sorted(daily_reports.items()):
        present_ids = report['present_employees']
        absent_ids = report['absent_employees']
        
        if report['is_weekend']:
            # Mark weekends as week_off for all
            weekend_sql = f"""-- {date_str} ({report['day_of_week']}) - Weekend
INSERT INTO attendance (employee_id, attendance_date, status, marked_at, marked_by, created_at)
SELECT 
  e.id,
  '{date_str}'::date,
  'week_off',
  NOW(),
  'system_import',
  NOW()
FROM employees e
WHERE e.branch = 'Hyderabad' 
  AND NOT EXISTS (
    SELECT 1 FROM attendance a 
    WHERE a.employee_id = e.id AND a.attendance_date = '{date_str}'::date
  );

"""
        else:
            # Regular day with present/absent status
            day_sql = f"""-- {date_str} ({report['day_of_week']}) - {report['present_count']} Present, {report['absent_count']} Absent
INSERT INTO attendance (employee_id, attendance_date, status, marked_at, marked_by, created_at)
SELECT 
  e.id,
  '{date_str}'::date,
  CASE 
    WHEN e.card_no IN ({', '.join([f"'{emp_id}'" for emp_id in present_ids])}) THEN 'present'
    ELSE 'absent'
  END,
  NOW(),
  'system_import',
  NOW()
FROM employees e
WHERE e.branch = 'Hyderabad' 
  AND NOT EXISTS (
    SELECT 1 FROM attendance a 
    WHERE a.employee_id = e.id AND a.attendance_date = '{date_str}'::date
  );

"""
        
        sql_statements.append(weekend_sql if report['is_weekend'] else day_sql)
    
    return ''.join(sql_statements)

def main():
    file_path = "/Users/rubeenakhan/Downloads/ALOG_001 (1).txt"
    
    # Analyze the attendance log
    daily_attendance, all_employees = analyze_attendance_log(file_path)
    
    print(f"Found {len(all_employees)} employees:")
    for emp_id, name in sorted(all_employees.items()):
        print(f"  {emp_id}: {name}")
    
    # Generate daily reports
    daily_reports = generate_daily_reports(daily_attendance, all_employees)
    
    # Generate SQL
    sql_content = generate_sql_insert_statements(daily_reports, all_employees)
    
    # Save to file
    output_file = "/Users/rubeenakhan/Downloads/pay-main/complete_daily_attendance_oct2025.sql"
    with open(output_file, 'w') as f:
        f.write("-- Complete Daily Attendance Report for October 2025\\n")
        f.write("-- Generated from ALOG_001 attendance log\\n\\n")
        f.write(sql_content)
    
    print(f"\\n✅ Complete SQL file generated: {output_file}")
    print("\\n📊 SUMMARY:")
    print(f"   Total days with data: {len(daily_reports)}")
    print(f"   Total employees: {len(all_employees)}")
    
    # Show attendance percentages
    total_present = sum(report['present_count'] for report in daily_reports.values())
    total_possible = len(daily_reports) * len(all_employees)
    overall_percentage = (total_present / total_possible) * 100 if total_possible > 0 else 0
    print(f"   Overall attendance: {overall_percentage:.1f}%")

if __name__ == "__main__":
    main()