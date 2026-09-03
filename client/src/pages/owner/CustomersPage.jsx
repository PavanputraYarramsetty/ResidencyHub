import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDateTime } from '../../utils/dateFormat';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const { data } = await api.get('/customers');
      setCustomers(data || []);
      if (data && data.length > 0) {
        setSelectedGuest(data[0]);
      }
    } catch (err) {
      toast.error('Failed to load guest directory');
    } finally {
      setLoading(false);
    }
  }

  // Search filter
  const filteredCustomers = customers.filter((c) => {
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGuest(guest);
                            }}
                            className="px-space-xs py-space-xxs rounded bg-surface-container text-on-surface hover:bg-surface-variant font-label-md text-label-md transition-colors"
                          >
                            Profile
                          </button>
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
                    <h2 className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                      {selectedGuest.full_name}
                    </h2>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {selectedGuest.age ? `${selectedGuest.age} yrs` : ''} {selectedGuest.gender ? `• ${selectedGuest.gender}` : ''}
                    </span>
                  </div>
                </div>
                <span className="px-space-xs py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md uppercase font-bold">
                  Verified Patron
                </span>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase">Phone</span>
                  <span className="font-tabular-numeric text-tabular-numeric text-on-surface">
                    {selectedGuest.phone || '—'}
                  </span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase">Govt ID</span>
                  <span className="font-tabular-numeric text-tabular-numeric text-on-surface">
                    {selectedGuest.aadhar_number || '—'}
                  </span>
                </div>
              </div>

              {/* Address */}
              <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-xxs">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase">Address / Native City</span>
                <span className="font-body-md text-body-md text-on-surface">
                  {selectedGuest.address || 'No permanent address recorded'}
                </span>
              </div>

              {/* Stay History Table */}
              <div className="flex flex-col gap-space-xs">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase">
                  Stay History & Bookings
                </span>
                <div className="flex flex-col gap-space-xxs font-body-sm text-body-sm max-h-48 overflow-y-auto">
                  {selectedGuest.bookings && selectedGuest.bookings.length > 0 ? (
                    selectedGuest.bookings.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between py-space-xs px-space-sm rounded bg-surface border border-surface-container-high/40"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface">
                            Room {b.rooms?.room_number || 'Unit'} — Status: {b.status}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            {formatDateTime(b.booking_date)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-body-sm text-on-surface-variant italic p-2">
                      Registered customer record
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-surface-container-high/60 text-center py-12 text-on-surface-variant">
              Select a guest from the directory to inspect profile
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
