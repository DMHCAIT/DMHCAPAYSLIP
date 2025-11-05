import { useState } from 'react';
import { Employee } from '../lib/supabase';
import { Users, IndianRupee, Plus, Edit, Save, X, Filter } from 'lucide-react';

type EmployeeListProps = {
  employees: Employee[];
  onSelectEmployee?: (employee: Employee) => void;
  selectedEmployee?: Employee | null;
  onAddEmployee: (employee: Partial<Employee>) => void;
  onUpdateEmployee: (id: string, employee: Partial<Employee>) => void;
};

export function EmployeeList({ 
  employees, 
  onSelectEmployee, 
  selectedEmployee, 
  onAddEmployee, 
  onUpdateEmployee 
}: EmployeeListProps) {
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    card_no: '',
    emp_code: '',
    employee_name: '',
    branch: '',
    salary: 0
  });
  const [editData, setEditData] = useState<Partial<Employee>>({});

  // Get unique branches for filter
  const branches = Array.from(new Set(employees.map(emp => emp.branch))).sort();
  
  // Filter employees by branch
  const filteredEmployees = branchFilter === 'all' 
    ? employees 
    : employees.filter(emp => emp.branch === branchFilter);

  const handleAddEmployee = () => {
    if (newEmployee.employee_name && newEmployee.branch) {
      onAddEmployee(newEmployee);
      setNewEmployee({
        card_no: '',
        emp_code: '',
        employee_name: '',
        branch: '',
        salary: 0
      });
      setShowAddForm(false);
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee.id);
    setEditData({
      card_no: employee.card_no,
      emp_code: employee.emp_code,
      employee_name: employee.employee_name,
      branch: employee.branch,
      salary: employee.salary
    });
  };

  const handleSaveEdit = () => {
    if (editingEmployee) {
      onUpdateEmployee(editingEmployee, editData);
      setEditingEmployee(null);
      setEditData({});
    }
  };

  const handleCancelEdit = () => {
    setEditingEmployee(null);
    setEditData({});
  };
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5" />
            <h2 className="text-xl font-bold">Employees ({filteredEmployees.length})</h2>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
        
        {/* Filters */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter by Branch:</span>
          </div>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-1 rounded border text-gray-800 text-sm"
          >
            <option value="all">All Branches</option>
            {branches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Employee Form */}
      {showAddForm && (
        <div className="border-b border-gray-200 p-6 bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Add New Employee</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card No</label>
              <input
                type="text"
                value={newEmployee.card_no}
                onChange={(e) => setNewEmployee({...newEmployee, card_no: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter card number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
              <input
                type="text"
                value={newEmployee.emp_code}
                onChange={(e) => setNewEmployee({...newEmployee, emp_code: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter employee code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name *</label>
              <input
                type="text"
                value={newEmployee.employee_name}
                onChange={(e) => setNewEmployee({...newEmployee, employee_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter employee name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
              <select
                value={newEmployee.branch}
                onChange={(e) => setNewEmployee({...newEmployee, branch: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Branch</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Delhi">Delhi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
              <input
                type="number"
                value={newEmployee.salary}
                onChange={(e) => setNewEmployee({...newEmployee, salary: Number(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter salary"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAddEmployee}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Card No
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Emp Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Branch
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Salary
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredEmployees.map((employee) => (
              <tr
                key={employee.id}
                className={`hover:bg-gray-50 transition-colors ${
                  selectedEmployee?.id === employee.id ? 'bg-blue-50' : ''
                }`}
              >
                {editingEmployee === employee.id ? (
                  // Edit mode
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <input
                        type="text"
                        value={editData.card_no || ''}
                        onChange={(e) => setEditData({...editData, card_no: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <input
                        type="text"
                        value={editData.emp_code || ''}
                        onChange={(e) => setEditData({...editData, emp_code: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <input
                        type="text"
                        value={editData.employee_name || ''}
                        onChange={(e) => setEditData({...editData, employee_name: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={editData.branch || ''}
                        onChange={(e) => setEditData({...editData, branch: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="Hyderabad">Hyderabad</option>
                        <option value="Delhi">Delhi</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <input
                        type="number"
                        value={editData.salary || 0}
                        onChange={(e) => setEditData({...editData, salary: Number(e.target.value)})}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  // View mode
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.card_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.emp_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {employee.employee_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {employee.branch}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {employee.salary.toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => onSelectEmployee?.(employee)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                        >
                          Attendance
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
