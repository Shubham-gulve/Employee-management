import { useEffect, useState } from 'react';
import axioApi from '../api/axioApi';

// Typeahead over the Department master collection.
// Keeps the typed text locally and reports the picked department id upwards.
export default function DepartmentInput({ value, text, onSelect, error }) {
  const [query, setQuery] = useState(text || '');
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(async () => {
      try {
        const res = await axioApi.get('/masters/departments', { params: { search: query } });
        setOptions(res.data.data);
      } catch {
        setOptions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, open]);

  const pick = (department) => {
    setQuery(department.name);
    setOpen(false);
    onSelect(department);
  };

  return (
    <div className="relative">
      <label className="block text-sm text-gray-700 mb-1">Department *</label>
      <input
        type="text"
        value={query}
        placeholder="Start typing..."
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onSelect(null); // typing again clears the earlier pick
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
      />

      {open && options.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow max-h-48 overflow-y-auto">
          {options.map((d) => (
            <li key={d._id}>
              <button
                type="button"
                onMouseDown={() => pick(d)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
              >
                {d.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
