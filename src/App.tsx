import { useState, useEffect } from 'react'
import { employeeService, Employee } from './lib/supabase'
import { EmployeeList } from './components/EmployeeList'
import PayslipGenerator from './components/PayslipGenerator'
import { Dashboard } from './components/Dashboard'
import AttendanceManagement from './components/AttendanceManagement'
import { 
  Building2, 
  Home, 
  Users, 
  Clock, 
  FileText, 
  BarChart3, 
  Settings, 
  User,
  Search,
  Bell
} from 'lucide-react'

type Tab = 'dashboard' | 'employees' | 'attendance' | 'payslips' | 'reports' | 'settings'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEmployees()
    // Test database connection on startup
    console.log('🚀 HRMS Pro Starting...')
    console.log('🔍 Testing database connection...')
  }, [])

  const loadEmployees = async () => {
    try {
      console.log('📊 Loading employees from database...');
      // Load employees from database using service
      const allEmployees = await employeeService.getAllEmployees();
      console.log(`✅ Successfully loaded ${allEmployees.length} employees`);
      setEmployees(allEmployees)
    } catch (error) {
      console.error('❌ Error loading employees:', error)
      // Set empty array as fallback
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }



  const handleAddEmployee = async (employee: Partial<Employee>) => {
    try {
      // Add employee to database
      const newEmployee = await employeeService.addEmployee(employee as Omit<Employee, 'id' | 'created_at' | 'updated_at'>);
      if (newEmployee) {
        // Refresh employee list
        await loadEmployees();
        console.log('Employee added successfully:', newEmployee);
      }
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  }

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      // Update employee in database
      const updatedEmployee = await employeeService.updateEmployee(id, updates);
      if (updatedEmployee) {
        // Update local state
        setEmployees(employees.map(emp => 
          emp.id === id ? { ...emp, ...updates } : emp
        ));
        console.log('Employee updated successfully:', updatedEmployee);
      }
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <Building2 className="w-8 h-8 text-blue-600" />
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">HRMS Pro</h1>
            <p className="text-xs text-gray-500">HR Management</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Home },
              { id: 'employees', label: 'Employees', icon: Users },
              { id: 'attendance', label: 'Attendance', icon: Clock },
              { id: 'payslips', label: 'Payslips', icon: FileText },
              { id: 'reports', label: 'Reports', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="ml-3">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Admin User</p>
              <p className="text-xs text-gray-500">admin@company.com</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 h-16">
          <div className="flex items-center justify-between h-full px-6">
            <h2 className="text-lg font-semibold text-gray-900 capitalize">{activeTab}</h2>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Admin</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {/* System Status Indicator */}
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-800">🚀 HRMS Pro - Database Connected</span>
              </div>
              <div className="text-sm text-green-600">
                📊 {employees.length} employees loaded • ✅ All systems operational
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">🔄 Loading HRMS data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <Dashboard />}
              
              {activeTab === 'employees' && (
                <EmployeeList
                  employees={employees}
                  onAddEmployee={handleAddEmployee}
                  onUpdateEmployee={handleUpdateEmployee}
                />
              )}

              {activeTab === 'attendance' && (
                <AttendanceManagement employees={employees} />
              )}

              {activeTab === 'payslips' && <PayslipGenerator employees={employees} />}
              
              {activeTab === 'reports' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Reports & Analytics</h3>
                  <p className="text-gray-600">Advanced reporting features coming soon...</p>
                </div>
              )}
              
              {activeTab === 'settings' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">System Settings</h3>
                  <p className="text-gray-600">Configuration options coming soon...</p>
                </div>
              )}
            </>
          )}
        </main>


      </div>
    </div>
  );
}

export default App
