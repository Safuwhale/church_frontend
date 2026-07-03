import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, UserPlus, UserMinus, RefreshCw, Search, Phone } from 'lucide-react';
import { secureFetch } from '../api/api';

export default function CellGroupTab() {
  const [cellGroups, setCellGroups] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [cellMembers, setCellMembers] = useState([]);
  const [selectedCellId, setSelectedCellId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [createForm, setCreateForm] = useState({ name: '' });
  const [renameForm, setRenameForm] = useState({ name: '' });

  const selectedCell = useMemo(
    () => cellGroups.find((cell) => String(cell.id) === String(selectedCellId)),
    [cellGroups, selectedCellId]
  );

  const fetchCellGroups = async () => {
    setIsLoading(true);
    try {
      const response = await secureFetch('/api/cells/groups');
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to load cell groups.');
        return;
      }

      const data = await response.json();
      setCellGroups(data);
      if (!selectedCellId && data.length > 0) {
        setSelectedCellId(String(data[0].id));
      }
    } catch (error) {
      console.error('Cell group load error:', error);
      alert('Network Error while loading cell groups.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const endpoint = searchTerm.trim()
        ? `/api/users/directory?q=${encodeURIComponent(searchTerm.trim())}`
        : '/api/users/directory';

      const response = await secureFetch(endpoint);
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to load members.');
        return;
      }

      setAllMembers(await response.json());
    } catch (error) {
      console.error('Member load error:', error);
      alert('Network Error while loading members.');
    }
  };

  const fetchCellMembers = async (cellId) => {
    if (!cellId) {
      setCellMembers([]);
      return;
    }

    try {
      const response = await secureFetch(`/api/cells/${cellId}/members`);
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to load cell members.');
        return;
      }

      setCellMembers(await response.json());
    } catch (error) {
      console.error('Cell member load error:', error);
      alert('Network Error while loading cell members.');
    }
  };

  useEffect(() => {
    void fetchCellGroups();
    void fetchMembers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMembers();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!selectedCell) {
      setRenameForm({ name: '' });
      setSelectedMemberIds([]);
      setCellMembers([]);
      return;
    }

    setRenameForm({ name: selectedCell.name || '' });
    void fetchCellMembers(selectedCell.id);
  }, [selectedCell]);

  useEffect(() => {
    setSelectedMemberIds(cellMembers.map((member) => String(member.id)));
  }, [cellMembers]);

  const handleCreateCell = async (event) => {
    event.preventDefault();
    if (!createForm.name.trim()) return;

    setIsLoading(true);
    try {
      const response = await secureFetch('/api/cells/create', {
        method: 'POST',
        body: JSON.stringify({ name: createForm.name.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to create cell group.');
        return;
      }

      setCreateForm({ name: '' });
      await fetchCellGroups();
    } catch (error) {
      console.error('Create cell error:', error);
      alert('Network Error while creating cell group.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameCell = async () => {
    if (!selectedCellId || !renameForm.name.trim()) return;

    setIsLoading(true);
    try {
      const response = await secureFetch(`/api/cells/${selectedCellId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: renameForm.name.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to rename cell group.');
        return;
      }

      await fetchCellGroups();
    } catch (error) {
      console.error('Rename cell error:', error);
      alert('Network Error while renaming cell group.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCell = async () => {
    if (!selectedCellId) return;
    if (!window.confirm('Delete this cell group? Members will be unassigned.')) return;

    setIsLoading(true);
    try {
      const response = await secureFetch(`/api/cells/${selectedCellId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to delete cell group.');
        return;
      }

      setSelectedCellId('');
      await fetchCellGroups();
      await fetchMembers();
    } catch (error) {
      console.error('Delete cell error:', error);
      alert('Network Error while deleting cell group.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMemberSelection = (memberId) => {
    const normalizedId = String(memberId);
    setSelectedMemberIds((currentIds) =>
      currentIds.includes(normalizedId)
        ? currentIds.filter((id) => id !== normalizedId)
        : [...currentIds, normalizedId]
    );
  };

  const handleAssignSelectedMembers = async (makeLeader = false) => {
    if (!selectedCellId || selectedMemberIds.length === 0) return;

    setIsLoading(true);
    try {
      const response = await secureFetch(`/api/cells/${selectedCellId}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_ids: selectedMemberIds, make_leader: makeLeader }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to assign members.');
        return;
      }

      await fetchCellGroups();
      await fetchCellMembers(selectedCellId);
      await fetchMembers();
    } catch (error) {
      console.error('Assign members error:', error);
      alert('Network Error while assigning members.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSelectedMembers = async () => {
    if (!selectedCellId || selectedMemberIds.length === 0) return;
    if (!window.confirm('Remove the selected members from this cell?')) return;

    setIsLoading(true);
    try {
      const response = await secureFetch(`/api/cells/${selectedCellId}/members/remove`, {
        method: 'POST',
        body: JSON.stringify({ user_ids: selectedMemberIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to remove members.');
        return;
      }

      setSelectedMemberIds([]);
      await fetchCellGroups();
      await fetchCellMembers(selectedCellId);
      await fetchMembers();
    } catch (error) {
      console.error('Remove members error:', error);
      alert('Network Error while removing members.');
    } finally {
      setIsLoading(false);
    }
  };

  const availableMembers = allMembers.filter(
    (member) => !member.cell_group_id || String(member.cell_group_id) === String(selectedCellId)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="font-display text-xl font-bold text-slate-800">Cell Group Manager</h3>
          <p className="text-slate-500 text-sm">Create groups, rename them, assign members, and manage leaders.</p>
        </div>
        <button
          onClick={() => {
            void fetchCellGroups();
            void fetchMembers();
          }}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60 w-fit"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h4 className="font-display font-bold text-slate-800 mb-4">Create Cell Group</h4>
            <form onSubmit={handleCreateCell} className="space-y-3">
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm((current) => ({ ...current, name: e.target.value }))}
                placeholder="Cell group name"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-blue text-white py-3 font-medium hover:bg-blue-700 transition-colors">
                <Plus size={18} />
                Create Cell Group
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h4 className="font-bold text-slate-800">Cell Groups</h4>
            </div>
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {cellGroups.map((cell) => (
                <button
                  key={cell.id}
                  onClick={() => setSelectedCellId(String(cell.id))}
                  className={`w-full text-left p-4 transition-colors ${String(selectedCellId) === String(cell.id) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                >
                  <p className="font-semibold text-slate-800">{cell.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{cell.member_count} members</p>
                </button>
              ))}
              {cellGroups.length === 0 && (
                <div className="p-4 text-sm text-slate-500">No cell groups created yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="font-display font-bold text-slate-800">Selected Cell Group</h4>
                <p className="text-sm text-slate-500">Rename the group or remove it entirely.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRenameCell}
                  disabled={!selectedCellId || isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
                >
                  <Pencil size={16} />
                  Save Changes
                </button>
                <button
                  onClick={handleDeleteCell}
                  disabled={!selectedCellId || isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-4">
              <input
                type="text"
                value={renameForm.name}
                onChange={(e) => setRenameForm((current) => ({ ...current, name: e.target.value }))}
                placeholder="Cell group name"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                disabled={!selectedCellId}
              />
            </div>

            {selectedCell && (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Members</p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">{selectedCell.member_count || 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Leader</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{selectedCell.leader_name || 'No leader assigned'}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Leader Contact</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{selectedCell.leader_phone || 'No contact available'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-display font-bold text-slate-800">Cell Members</h4>
                <p className="text-sm text-slate-500">Click a cell group to view it's members.</p>
              </div>
              <span className="text-sm font-medium text-slate-500">{cellMembers.length} members</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Member ID</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cellMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{member.first_name} {member.last_name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-600">{member.serial_number}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Phone size={14} />
                          {member.phone_number}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 capitalize">{member.role}</td>
                    </tr>
                  ))}
                  {cellMembers.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                        No members in this cell group yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h4 className="font-display font-bold text-slate-800">Members</h4>
                <p className="text-sm text-slate-500">Select one or more members to assign or remove them.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleAssignSelectedMembers(false)}
                  disabled={!selectedCellId || selectedMemberIds.length === 0 || isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-60"
                >
                  <UserPlus size={16} />
                  Add Member
                </button>
                <button
                  onClick={() => handleAssignSelectedMembers(true)}
                  disabled={!selectedCellId || selectedMemberIds.length === 0 || isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:opacity-60"
                >
                  <UserPlus size={16} />
                  Assign as Leader
                </button>
                <button
                  onClick={handleRemoveSelectedMembers}
                  disabled={!selectedCellId || selectedMemberIds.length === 0 || isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors disabled:opacity-60"
                >
                  <UserMinus size={16} />
                  Remove
                </button>
              </div>
            </div>

            <div className="relative mb-4">
              <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search members to assign..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 max-h-[520px] overflow-y-auto pr-1">
              {availableMembers.map((member) => {
                const selected = selectedMemberIds.includes(String(member.id));

                return (
                  <button
                    key={member.id}
                    onClick={() => toggleMemberSelection(member.id)}
                    className={`text-left p-4 rounded-2xl border transition-colors ${selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-800">{member.first_name} {member.last_name}</p>
                        <p className="text-sm text-slate-500">{member.serial_number}</p>
                        <p className="text-xs text-slate-400 mt-1">{member.phone_number}</p>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                        {member.role}
                      </span>
                    </div>
                  </button>
                );
              })}
              {availableMembers.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
                  No matching members found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
