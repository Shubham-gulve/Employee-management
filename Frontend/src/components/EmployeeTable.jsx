import { imageUrl } from '../api/axioApi';

export default function EmployeeTable({ employees, loading, onEdit, onDelete }) {
  if (loading) {
    return <p className="p-6 text-sm text-gray-500">Loading employees...</p>;
  }

  if (employees.length === 0) {
    return <p className="p-6 text-sm text-gray-500">No employees added yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3">Photo</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Gender</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">City / State</th>
            <th className="px-4 py-3">Permanent</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 text-gray-700">
          {employees.map((employee) => (
            <tr key={employee._id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                {employee.profilePicture ? (
                  <img
                    src={imageUrl(employee.profilePicture)}
                    alt={employee.name}
                    className="w-10 h-10 rounded object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{employee.name}</td>
              <td className="px-4 py-3">{employee.email}</td>
              <td className="px-4 py-3">{employee.phone}</td>
              <td className="px-4 py-3">{employee.gender}</td>
              <td className="px-4 py-3">{employee.department?.name}</td>
              <td className="px-4 py-3">
                {employee.city?.name}, {employee.state?.name}
              </td>
              <td className="px-4 py-3">{employee.isPermanent ? 'Yes' : 'No'}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button
                  onClick={() => onEdit(employee)}
                  className="text-blue-600 hover:underline mr-4"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(employee)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
