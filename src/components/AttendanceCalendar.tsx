import { useState, useEffect } from 'react';
import { Calendar, Check, X } from 'lucide-react';
import { supabase, Employee, Attendance } from '../lib/supabase';

type AttendanceCalendarProps = {
  selectedEmployee: Employee | null;
  onClose: () => void;
};

export function AttendanceCalendar({ selectedEmployee, onClose }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<Map<string, Attendance>>(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedEmployee) {
      loadAttendance();
    }
  }, [selectedEmployee, currentMonth]);

  const loadAttendance = async () => {
    if (!selectedEmployee) return;

    setLoading(true);
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', selectedEmployee.id)
      .gte('attendance_date', startOfMonth.toISOString().split('T')[0])
      .lte('attendance_date', endOfMonth.toISOString().split('T')[0]);

    if (!error && data) {
      const map = new Map<string, Attendance>();
      data.forEach((record) => {
        map.set(record.attendance_date, record);
      });
      setAttendanceRecords(map);
    }
    setLoading(false);
  };

  const markAttendance = async (date: Date, status: 'present' | 'absent') => {
    if (!selectedEmployee) return;

    const dateStr = date.toISOString().split('T')[0];
    const existingRecord = attendanceRecords.get(dateStr);

    if (existingRecord) {
      const { error } = await supabase
        .from('attendance')
        .update({ status })
        .eq('id', existingRecord.id);

      if (!error) {
        loadAttendance();
      }
    } else {
      const { error } = await supabase
        .from('attendance')
        .insert({
          employee_id: selectedEmployee.id,
          attendance_date: dateStr,
          status,
        });

      if (!error) {
        loadAttendance();
      }
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getAttendanceStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const record = attendanceRecords.get(dateStr);

    if (date.getDay() === 0) {
      return 'week_off';
    }

    return record?.status || null;
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  if (!selectedEmployee) return null;

  const days = getDaysInMonth();
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Mark Attendance
            </h2>
            <p className="text-gray-600 mt-1">
              {selectedEmployee.employee_name} ({selectedEmployee.emp_code})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => changeMonth(-1)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
            >
              Previous
            </button>
            <h3 className="text-xl font-semibold">{monthName}</h3>
            <button
              onClick={() => changeMonth(1)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
            >
              Next
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-700 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const status = getAttendanceStatus(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSunday = date.getDay() === 0;

              return (
                <div
                  key={date.toISOString()}
                  className={`aspect-square border rounded-lg p-2 ${
                    isToday ? 'border-blue-500 border-2' : 'border-gray-300'
                  } ${isSunday ? 'bg-gray-100' : 'bg-white'}`}
                >
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {date.getDate()}
                  </div>

                  {isSunday ? (
                    <div className="text-xs text-gray-500 text-center mt-2">Week Off</div>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => markAttendance(date, 'present')}
                        className={`flex-1 p-1 rounded ${
                          status === 'present'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 hover:bg-green-100 text-green-600'
                        }`}
                        title="Mark Present"
                      >
                        <Check className="w-4 h-4 mx-auto" />
                      </button>
                      <button
                        onClick={() => markAttendance(date, 'absent')}
                        className={`flex-1 p-1 rounded ${
                          status === 'absent'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 hover:bg-red-100 text-red-600'
                        }`}
                        title="Mark Absent"
                      >
                        <X className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span>Week Off (Sunday)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
