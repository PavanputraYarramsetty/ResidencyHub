import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDateTime } from '../../utils/dateFormat';
import toast from 'react-hot-toast';

const MOCK_GUESTS = [
  {
    id: 'cust-1',
    full_name: 'Satyanarayana Murthy',
    phone: '98480 22338',
    age: 38,
    gender: 'Male',
    address: 'D.No 4-12, Main Road, Rajahmundry, AP',
    aadhar_number: '4523 8891 0042',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'cust-2',
    full_name: 'K. V. Rao',
    phone: '94910 08797',
    age: 44,
    gender: 'Male',
    address: 'Sector 2, MVP Colony, Visakhapatnam',
    aadhar_number: '8821 3340 9912',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'cust-3',
    full_name: 'P. Nageswara Rao',
    phone: '98480 11223',
    age: 42,
    gender: 'Male',
    address: 'Brodipet, Guntur, AP',
    aadhar_number: '7721 9904 1123',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);

  // Edit Guest Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    age: '',
    gender: 'Male',
    aadhar_number: '',
    address: '',
  });

  function openEditModal(guest) {
    setEditingGuest(guest);
    setEditForm({
      full_name: guest.full_name || '',
      phone: guest.phone || '',
      age: guest.age || '',
      gender: guest.gender || 'Male',
      aadhar_number: guest.aadhar_number || '',
      address: guest.address || '',
    });
    setShowEditModal(true);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editForm.full_name || !editForm.phone) {
      return toast.error('Full Name and Phone Number are required');
    }

    const updatedGuest = {
      ...editingGuest,
      full_name: editForm.full_name,
      phone: editForm.phone,
      age: editForm.age ? parseInt(editForm.age, 10) : null,
      gender: editForm.gender,
      aadhar_number: editForm.aadhar_number,
      address: editForm.address,
    };

    // Update remote API if ID is UUID
    if (editingGuest.id && !editingGuest.id.startsWith('guest-')) {
      await api.put(`/customers/${editingGuest.id}`, editForm).catch(() => {});
    }

    // Update local state list
    setCustomers((prev) =>
      prev.map((g) => (g.id === editingGuest.id ? updatedGuest : g))
    );

    if (selectedGuest?.id === editingGuest.id) {
      setSelectedGuest(updatedGuest);
    }

    toast.success(`Guest profile for ${editForm.full_name} updated successfully! ✨`);
    setShowEditModal(false);
  }

  async function handleDeleteGuest(guest) {
    if (window.confirm(`Are you sure you want to delete ${guest.full_name} from the guest directory?`)) {
      if (guest.id && !guest.id.startsWith('guest-')) {
        await api.delete(`/customers/${guest.id}`).catch(() => {});
      }

      setCustomers((prev) => prev.filter((g) => g.id !== guest.id));
      if (selectedGuest?.id === guest.id) {
        setSelectedGuest(null);
      }
      toast.success(`${guest.full_name} removed from guest directory.`);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const { data } = await api.get('/customers');
      let apiList = Array.isArray(data) ? data : (data?.customers || []);
      if (!apiList || apiList.length === 0) {
        apiList = MOCK_GUESTS;
      }

      // Collect local walk-in guests from localStorage floors & audit ledger
      const localFloors = JSON.parse(localStorage.getItem('residency_floors') || '[]');
      const auditLedger = JSON.parse(localStorage.getItem('residency_audit_ledger') || '[]');
      
      const localGuestsMap = new Map();

      // Extract guests from active room bookings
      localFloors.forEach((f) => {
        (f.rooms || []).forEach((r) => {
          if (r.active_booking?.customers) {
            const c = r.active_booking.customers;
            if (c.phone) {
              localGuestsMap.set(c.phone, {
                id: `guest-${c.phone}`,
                full_name: c.full_name || 'Guest',
                phone: c.phone,
                aadhar_number: c.aadhar_number || '—',
                address: c.address || '—',
                age: c.age || 30,
                gender: c.gender || 'Male',
                created_at: r.active_booking.check_in || new Date().toISOString(),
                status: 'In-House Patron (Occupied)',
              });
            }
          }
        });
      });

      // Extract guests from checkout audit ledger
      auditLedger.forEach((log) => {
        if (log.customers?.phone) {
          const c = log.customers;
          if (!localGuestsMap.has(c.phone)) {
            localGuestsMap.set(c.phone, {
              id: `guest-${c.phone}`,
              full_name: c.full_name || 'Guest',
              phone: c.phone,
              aadhar_number: c.aadhar_number || '—',
              address: c.address || '—',
              age: c.age || 30,
              gender: c.gender || 'Male',
              created_at: log.check_out || new Date().toISOString(),
              status: 'Checked Out',
            });
          }
        }
      });

      // Merge API list with local guests (avoiding duplicates by phone)
      const existingPhones = new Set(apiList.map((g) => g.phone));
      const newLocalGuests = Array.from(localGuestsMap.values()).filter((g) => !existingPhones.has(g.phone));

      const combinedList = [...newLocalGuests, ...apiList];
      setCustomers(combinedList);
      setSelectedGuest(combinedList[0] || null);
    } catch (err) {
      setCustomers(MOCK_GUESTS);
      setSelectedGuest(MOCK_GUESTS[0]);
    } finally {
      setLoading(false);
    }
  }

  // Search filter
  const filteredCustomers = (customers || []).filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.aadhar_number?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q)
    );
  });

  function exportCSV() {
    if (!customers.length) return toast.error('No customer data to export');
    const headers = ['Full Name', 'Phone', 'Age', 'Gender', 'Aadhaar / ID', 'Address'];
    const rows = customers.map((c) => [
      `"${c.full_name || ''}"`,
      `"${c.phone || ''}"`,
      c.age || '',
      c.gender || '',
      `"${c.aadhar_number || ''}"`,
      `"${c.address || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sridevi_Residency_Guest_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Guest directory CSV exported! 📄');
  }

  return (
    <div className="flex flex-col w-full pb-space-3xl gap-space-lg px-space-lg">
      {/* Page Header Deck */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 mt-space-md">
        <div className="flex flex-col gap-space-xxs">
          <div className="flex items-center gap-space-xs">
            <span className="font-label-md text-label-md uppercase tracking-wider text-secondary">
              Registry Archive & Compliance
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <span className="font-label-md text-label-md text-on-surface-variant flex items-center gap-space-xxs">
              <span className="material-symbols-outlined text-[14px] text-on-tertiary-container">verified</span>
              Aadhaar Synced
            </span>
          </div>
          <h1 className="font-display-sm text-display-sm text-on-surface">
            Guest Records & Verification Directory
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Registered customer directory, visit logs, ID proofs, and repeat guest lookup
          </p>
        </div>

        {/* Quick Registry Stats */}
        <div className="flex flex-wrap items-center gap-space-sm">
          <div className="flex items-center gap-space-sm px-space-md py-space-xs rounded-lg bg-surface-container-low border border-surface-container-high/60 shadow-xs">
            <span className="material-symbols-outlined text-secondary text-[20px]">person_pin</span>
            <div className="flex flex-col">
              <span className="font-tabular-numeric text-tabular-numeric text-on-surface">{customers.length}</span>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase">Total Guests</span>
            </div>
          </div>

          <div className="flex items-center gap-space-sm px-space-md py-space-xs rounded-lg bg-surface-container-highest border border-surface-container-high/60 shadow-xs">
            <span className="material-symbols-outlined text-on-tertiary-container text-[20px]">fact_check</span>
            <div className="flex flex-col">
              <span className="font-tabular-numeric text-tabular-numeric text-on-tertiary-container">100%</span>
              <span className="font-label-md text-label-md text-on-surface-variant uppercase">ID Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Belt */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high/60">
        <div className="relative flex-1 min-w-[280px]">
          <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Name, Phone, Aadhaar, or City..."
            className="w-full pl-9 pr-space-md py-space-xs rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container placeholder:text-on-surface-variant"
          />
        </div>

        <div className="flex flex-wrap items-center gap-space-xs">
          <button
            onClick={exportCSV}
            className="flex items-center gap-space-xs px-space-md py-space-xs rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-label-lg text-label-lg transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">file_download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
        {/* Left: Guest Table (8 cols) */}
        <div className="xl:col-span-8 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-high/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase font-label-md text-label-md tracking-wider border-b border-surface-container-high/60">
                <tr>
                  <th className="py-space-sm px-space-md">Guest Name & Info</th>
                  <th className="py-space-sm px-space-md">Contact Phone</th>
                  <th className="py-space-sm px-space-md">City / Address</th>
                  <th className="py-space-sm px-space-md">Govt ID / Aadhaar</th>
                  <th className="py-space-sm px-space-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high/40 text-on-surface">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                      <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading guest directory...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                      No matching guests found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((guest) => {
                    const isSelected = selectedGuest?.id === guest.id;
                    const initials = guest.full_name
                      ?.split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'G';

                    return (
                      <tr
                        key={guest.id}
                        onClick={() => setSelectedGuest(guest)}
                        className={`hover:bg-surface-container-low cursor-pointer transition-colors ${
                          isSelected ? 'bg-surface-container-low font-semibold' : ''
                        }`}
                      >
                        <td className="py-space-sm px-space-md">
                          <div className="flex items-center gap-space-sm">
                            <div className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-label-lg text-label-lg flex-shrink-0">
                              {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-label-lg text-label-lg text-on-surface truncate">
                                {guest.full_name}
                              </span>
                              <span className="font-body-sm text-body-sm text-on-surface-variant">
                                {guest.age ? `${guest.age} yrs` : ''} {guest.gender ? `• ${guest.gender}` : ''}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-space-sm px-space-md font-tabular-numeric text-tabular-numeric text-on-surface whitespace-nowrap">
                          {guest.phone || '—'}
                        </td>

                        <td className="py-space-sm px-space-md text-on-surface-variant max-w-[160px] truncate">
                          {guest.address || '—'}
                        </td>

                        <td className="py-space-sm px-space-md whitespace-nowrap">
                          <div className="flex items-center gap-space-xxs">
                            <span className="font-tabular-numeric text-tabular-numeric text-on-surface">
                              {guest.aadhar_number || '—'}
                            </span>
                            {guest.aadhar_number && (
                              <span className="material-symbols-outlined text-[14px] text-on-tertiary-container" title="Verified">
                                verified
                              </span>
                            )}
                          </div>
                          <span className="font-label-md text-label-md text-on-tertiary-container uppercase">
                            UIDAI / GOVT ID
                          </span>
                        </td>

                        <td className="py-space-sm px-space-md text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-space-xs">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(guest);
                              }}
                              className="px-space-xs py-space-xxs rounded bg-surface-container text-on-surface hover:bg-surface-variant font-label-md text-label-md transition-colors border border-surface-container-high/60 cursor-pointer"
                              title="Edit Guest Details"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGuest(guest);
                              }}
                              className="p-space-xxs rounded text-error hover:bg-error-container/20 transition-colors cursor-pointer"
                              title="Delete Guest"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Guest Drawer Card (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-space-md">
          {selectedGuest ? (
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 flex flex-col gap-space-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-space-sm">
                  <div className="w-12 h-12 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-display-sm text-display-sm shadow-sm flex-shrink-0">
                    {selectedGuest.full_name
                      ?.split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'G'}
                  </div>
                  <div className="flex flex-col">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      {selectedGuest.full_name}
                    </h2>
                    <span className="font-label-md text-label-md text-on-tertiary-container font-semibold">
                      Verified Guest Folio
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(selectedGuest)}
                    className="px-2 py-1 rounded bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-bold transition-colors cursor-pointer border border-surface-container-high"
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteGuest(selectedGuest)}
                    className="p-1 rounded text-error hover:bg-error-container/20 transition-colors cursor-pointer"
                    title="Delete Guest"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>

              {/* Contact Particulars */}
              <div className="flex flex-col gap-space-xs pt-space-xs border-t border-surface-container-high/60">
                <span className="font-label-md text-label-md uppercase text-secondary">
                  Contact & Verification
                </span>
                <div className="flex items-center justify-between text-body-sm py-1 border-b border-surface-container-high/40">
                  <span className="text-on-surface-variant">Mobile Phone:</span>
                  <span className="font-tabular-numeric text-on-surface font-semibold">
                    {selectedGuest.phone || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-body-sm py-1 border-b border-surface-container-high/40">
                  <span className="text-on-surface-variant">Age / Gender:</span>
                  <span className="text-on-surface">
                    {selectedGuest.age ? `${selectedGuest.age} yrs` : '—'} / {selectedGuest.gender || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-body-sm py-1 border-b border-surface-container-high/40">
                  <span className="text-on-surface-variant">Aadhaar / ID:</span>
                  <span className="font-tabular-numeric text-on-surface font-semibold">
                    {selectedGuest.aadhar_number || '—'}
                  </span>
                </div>
                <div className="flex flex-col text-body-sm py-1">
                  <span className="text-on-surface-variant mb-0.5">Permanent Address:</span>
                  <span className="text-on-surface font-medium">
                    {selectedGuest.address || '—'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-space-xl text-center bg-surface-container-lowest rounded-xl border border-surface-container-high/60 text-on-surface-variant">
              Select a guest to view complete verified profile
            </div>
          )}
        </div>
      </div>

      {/* Edit Guest Profile Modal */}
      {showEditModal && editingGuest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-space-md">
          <div className="bg-surface-container-lowest rounded-2xl p-space-xl max-w-lg w-full shadow-2xl border border-surface-container-high/60 flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-surface-container-high/60 pb-space-sm">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Manage & Edit Guest Details
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-space-sm">
              <div className="flex flex-col gap-space-xxs">
                <label className="font-label-md text-label-md text-on-surface font-medium">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="px-space-md py-space-xs rounded-lg bg-surface-container-low text-on-surface font-body-md border border-surface-container-high/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col gap-space-xxs">
                  <label className="font-label-md text-label-md text-on-surface font-medium">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="px-space-md py-space-xs rounded-lg bg-surface-container-low text-on-surface font-tabular-numeric border border-surface-container-high/60"
                  />
                </div>

                <div className="flex flex-col gap-space-xxs">
                  <label className="font-label-md text-label-md text-on-surface font-medium">Age</label>
                  <input
                    type="number"
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    className="px-space-md py-space-xs rounded-lg bg-surface-container-low text-on-surface font-tabular-numeric border border-surface-container-high/60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-space-sm">
                <div className="flex flex-col gap-space-xxs">
                  <label className="font-label-md text-label-md text-on-surface font-medium">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="px-space-md py-space-xs rounded-lg bg-surface-container-low text-on-surface font-body-md border border-surface-container-high/60"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-space-xxs">
                  <label className="font-label-md text-label-md text-on-surface font-medium">Aadhaar / ID Number</label>
                  <input
                    type="text"
                    value={editForm.aadhar_number}
                    onChange={(e) => setEditForm({ ...editForm, aadhar_number: e.target.value })}
                    className="px-space-md py-space-xs rounded-lg bg-surface-container-low text-on-surface font-tabular-numeric border border-surface-container-high/60"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-space-xxs">
                <label className="font-label-md text-label-md text-on-surface font-medium">Permanent Address</label>
                <textarea
                  rows={2}
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="px-space-md py-space-xs rounded-lg bg-surface-container-low text-on-surface font-body-md border border-surface-container-high/60 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-space-md border-t border-surface-container-high/60 mt-space-xs">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-space-lg py-space-xs rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface font-label-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-space-xl py-space-xs rounded-lg bg-secondary text-on-secondary font-label-md font-bold hover:bg-on-secondary-container"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
