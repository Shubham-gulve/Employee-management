import { useEffect, useState } from 'react';
import axioApi, { imageUrl } from '../api/axioApi';
import DepartmentInput from './DepartmentInput';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  gender: '',
  department: '',
  departmentName: '',
  state: '',
  city: '',
  pincode: '',
  address: '',
  isPermanent: false,
};

// Builds the form state from an employee record coming back from the API.
const toFormState = (employee) => ({
  name: employee.name,
  email: employee.email,
  phone: employee.phone,
  gender: employee.gender,
  department: employee.department?._id || '',
  departmentName: employee.department?.name || '',
  state: employee.state?._id || '',
  city: employee.city?._id || '',
  pincode: employee.pincode,
  address: employee.address,
  isPermanent: employee.isPermanent,
});

// The parent remounts this form (via key) when the edited employee changes,
// so the initial state can simply be read from the props.
export default function EmployeeForm({ editing, onSave, onCancel, saving }) {
  const [form, setForm] = useState(editing ? toFormState(editing) : emptyForm);
  const [errors, setErrors] = useState({});
  const [picture, setPicture] = useState(null);
  const [preview, setPreview] = useState(editing ? imageUrl(editing.profilePicture) : '');
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // State master is needed once, cities are loaded per selected state.
  useEffect(() => {
    axioApi
      .get('/masters/states')
      .then((res) => setStates(res.data.data))
      .catch(() => setStates([]));
  }, []);

  useEffect(() => {
    if (!form.state) return;

    axioApi
      .get('/masters/cities', { params: { stateId: form.state } })
      .then((res) => setCities(res.data.data))
      .catch(() => setCities([]));
  }, [form.state]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPicture(file);
    setPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const found = {};

    if (!form.name.trim()) found.name = 'Name is required';
    if (!form.email.trim()) found.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = 'Enter a valid email';
    if (!/^\d{10}$/.test(form.phone)) found.phone = 'Phone must be 10 digits';
    if (!form.gender) found.gender = 'Select a gender';
    if (!form.department) found.department = 'Select a department';
    if (!form.state) found.state = 'Select a state';
    if (!form.city) found.city = 'Select a city';
    if (!/^\d{6}$/.test(form.pincode)) found.pincode = 'Pincode must be 6 digits';
    if (!form.address.trim()) found.address = 'Address is required';

    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Multipart, because the profile picture goes along with the fields.
    const data = new FormData();
    data.append('name', form.name);
    data.append('email', form.email);
    data.append('phone', form.phone);
    data.append('gender', form.gender);
    data.append('department', form.department);
    data.append('state', form.state);
    data.append('city', form.city);
    data.append('pincode', form.pincode);
    data.append('address', form.address);
    data.append('isPermanent', form.isPermanent);
    if (picture) data.append('profilePicture', picture);

    onSave(data);
  };

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500';

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-base font-semibold text-gray-800 mb-4">
        {editing ? 'Edit Employee' : 'Add Employee'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Profile picture with thumbnail preview */}
        <div className="md:col-span-3 flex items-center gap-4">
          {preview ? (
            <img src={preview} alt="Preview" className="w-16 h-16 rounded object-cover border border-gray-200" />
          ) : (
            <div className="w-16 h-16 rounded border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
              No photo
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Profile Picture</label>
            <input type="file" accept="image/*" onChange={handleFile} className="text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Name *</label>
          <input name="name" value={form.name} onChange={handleChange} className={inputClass} />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Email *</label>
          <input name="email" value={form.email} onChange={handleChange} className={inputClass} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Phone *</label>
          <input
            name="phone"
            value={form.phone}
            maxLength={10}
            inputMode="numeric"
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
            className={inputClass}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>

        <div>
          <span className="block text-sm text-gray-700 mb-1">Gender *</span>
          <div className="flex items-center gap-4 py-2">
            {[
              { value: 'M', label: 'Male' },
              { value: 'F', label: 'Female' },
              { value: 'Other', label: 'Other' },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-1.5 text-sm text-gray-700">
                <input
                  type="radio"
                  name="gender"
                  value={option.value}
                  checked={form.gender === option.value}
                  onChange={handleChange}
                />
                {option.label}
              </label>
            ))}
          </div>
          {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
        </div>

        <DepartmentInput
          value={form.department}
          text={form.departmentName}
          error={errors.department}
          onSelect={(department) =>
            setForm({
              ...form,
              department: department?._id || '',
              departmentName: department?.name || '',
            })
          }
        />

        <div>
          <label className="block text-sm text-gray-700 mb-1">State *</label>
          <select
            name="state"
            value={form.state}
            onChange={(e) => {
              setCities([]);
              setForm({ ...form, state: e.target.value, city: '' });
            }}
            className={inputClass}
          >
            <option value="">Select state</option>
            {states.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">City *</label>
          <select
            name="city"
            value={form.city}
            onChange={handleChange}
            disabled={!form.state}
            className={`${inputClass} disabled:bg-gray-100`}
          >
            <option value="">{form.state ? 'Select city' : 'Select a state first'}</option>
            {cities.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">Pincode *</label>
          <input
            name="pincode"
            value={form.pincode}
            maxLength={6}
            inputMode="numeric"
            onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })}
            className={inputClass}
          />
          {errors.pincode && <p className="mt-1 text-xs text-red-600">{errors.pincode}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700 mb-1">Address *</label>
          <textarea name="address" rows={3} value={form.address} onChange={handleChange} className={inputClass} />
          {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
        </div>

        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="isPermanent" checked={form.isPermanent} onChange={handleChange} />
            Is Permanent
          </label>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : editing ? 'Update Employee' : 'Add Employee'}
        </button>

        {editing && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
