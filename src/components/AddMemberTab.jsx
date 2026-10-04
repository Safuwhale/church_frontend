import { useState } from 'react';
import { CheckCircle2, UserPlus, Upload, FileSpreadsheet } from 'lucide-react';
import { secureFetch } from '../api/api';

const initialForm = {
  first_name: '', last_name: '', phone_number: '', whatsapp_number: '',
  whatsapp_same_as_phone: true, dob: '', location_zone: '',
  contact_person_name: '', contact_person_relation: '', contact_person_phone: '',
  email: '', sex: '',
};

export default function AddMemberTab() {
  const [form, setForm] = useState(initialForm);
  const [createdMember, setCreatedMember] = useState(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    const payload = { ...form, whatsapp_number: form.whatsapp_same_as_phone ? form.phone_number : form.whatsapp_number };
    delete payload.whatsapp_same_as_phone;
    Object.keys(payload).forEach((key) => { if (payload[key] === '') payload[key] = null; });

    try {
      const response = await secureFetch('/api/users/admin-create', { method: 'POST', body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(Array.isArray(data.detail) ? data.detail.map((item) => item.msg).join(', ') : data.detail || 'Could not create member.');
      setCreatedMember(data);
      setForm(initialForm);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20';
  const fields = [
    ['first_name', 'First name', true], ['last_name', 'Last name', true], ['phone_number', 'Phone number', false],
    ['dob', 'Date of birth', false, 'date'], ['location_zone', 'Location / zone', false],
    ['contact_person_name', 'Emergency contact name', false], ['contact_person_relation', 'Relationship', false],
    ['contact_person_phone', 'Emergency contact phone', false], ['email', 'Email', false, 'email'], ['sex', 'Sex', false],
  ];

  const uploadSheet = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setIsSaving(true);
    const body = new FormData();
    body.append('file', file);
    try {
      const response = await secureFetch('/api/users/admin-bulk', { method: 'POST', body, headers: {} });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Could not import members.');
      setCreatedMember({ bulk: true, ...data });
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsSaving(false);
      event.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div><h3 className="font-display text-2xl font-bold text-slate-800">Add New Member</h3><p className="mt-1 text-sm text-slate-500">Create a member record and issue a generated HORYC ID.</p></div>
      {createdMember && !createdMember.bulk && <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"><CheckCircle2 className="mt-0.5" size={20} /><div><p className="font-semibold">Member created successfully.</p><p className="text-sm">ID and initial password: <strong className="font-mono">{createdMember.serial_number}</strong></p></div></div>}
      {createdMember?.bulk && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"><p className="font-semibold">Bulk import complete</p><p className="text-sm">Added {createdMember.created_count} members; skipped {createdMember.skipped_count} rows.</p>{createdMember.skipped?.length > 0 && <ul className="mt-2 list-disc pl-5 text-sm">{createdMember.skipped.slice(0, 10).map((item) => <li key={`${item.row}-${item.name}`}>Row {item.row}: {item.reason}</li>)}</ul>}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4"><UserPlus className="text-brand-blue" size={21} /><h4 className="font-semibold text-slate-800">Member details</h4></div>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(([name, label, required, type = 'text']) => <label key={name} className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500"> *</span>}<input name={name} type={type} required={required} value={form[name]} onChange={update} className={inputClass} /></label>)}
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-600"><input type="checkbox" name="whatsapp_same_as_phone" checked={form.whatsapp_same_as_phone} onChange={update} /> WhatsApp is the same as phone</label>
          {!form.whatsapp_same_as_phone && <label className="text-sm font-medium text-slate-700">WhatsApp number<input name="whatsapp_number" value={form.whatsapp_number} onChange={update} className={inputClass} /></label>}
        </div>
        <button disabled={isSaving} className="mt-6 rounded-xl bg-brand-blue px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">{isSaving ? 'Creating...' : 'Create member'}</button>
      </form>
      <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 sm:p-7"><div className="flex items-start gap-3"><FileSpreadsheet className="mt-0.5 text-indigo-600" size={21} /><div><h4 className="font-semibold text-slate-800">Bulk add from spreadsheet</h4><p className="mt-1 text-sm text-slate-600">Upload the same sheet format as Members details: a required <strong>Member Name</strong> column and optional <strong>Phone</strong> column. Names must contain first and last name.</p><label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><Upload size={16} />{isSaving ? 'Importing...' : 'Choose Excel or CSV'}<input type="file" accept=".xlsx,.xls,.csv" onChange={uploadSheet} disabled={isSaving} className="hidden" /></label></div></div></section>
    </div>
  );
}
