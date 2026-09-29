import React, { useState } from 'react';
import { 
  Plus, 
  Edit2
} from 'lucide-react';
import { 
  getBulkImportAliasMappings, 
  saveBulkImportAliasMapping 
} from '../../../data/portalStore.js';
import { DEPARTMENTS } from '../../../data/masterData.js';

export default function AliasMappingsView({ currentUser }) {
  const [, setDataVersion] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [sourceValue, setSourceValue] = useState('');
  const [targetDept, setTargetDept] = useState('CSE');
  const [moduleKey, setModuleKey] = useState('academic_events');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const mappings = getBulkImportAliasMappings();

  const handleOpenAdd = () => {
    setEditingMapping(null);
    setSourceValue('');
    setTargetDept('CSE');
    setModuleKey('academic_events');
    setModalOpen(true);
  };

  const handleOpenEdit = (mapping) => {
    setEditingMapping(mapping);
    setSourceValue(mapping.sourceValueNormalized);
    setTargetDept(mapping.targetId);
    setModuleKey(mapping.moduleKey);
    setModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!sourceValue.trim()) {
      showToast('Source alias text cannot be empty.');
      return;
    }

    const matchedDept = DEPARTMENTS.find(d => d.code === targetDept);
    const targetLabel = matchedDept ? matchedDept.name : targetDept;

    const payload = {
      ...(editingMapping || {}),
      moduleKey,
      fieldKey: 'department',
      sourceValueNormalized: sourceValue.toLowerCase().trim(),
      targetType: 'department',
      targetId: targetDept,
      targetLabel,
      isActive: true
    };

    saveBulkImportAliasMapping(payload, currentUser);
    setModalOpen(false);
    setDataVersion(v => v + 1);
    showToast(`Alias rule "${sourceValue}" -> "${targetLabel}" saved.`);
  };

  const handleToggleActive = (mapping) => {
    saveBulkImportAliasMapping({ ...mapping, isActive: !mapping.isActive }, currentUser);
    setDataVersion(v => v + 1);
    showToast(`Rule "${mapping.sourceValueNormalized}" is now ${!mapping.isActive ? 'Active' : 'Disabled'}.`);
  };

  const canManage = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toast */}
      {toastMessage && (
        <div style={{ padding: '0.65rem 1rem', borderRadius: '8px', background: '#0F172A', color: '#F1C40F', fontSize: '0.82rem', fontWeight: 700 }}>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.25rem 0' }}>
            Institutional Data Mapping Rules & Aliases
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>
            Configure how informal branch codes (e.g. "DS", "CS", "AIML") automatically resolve to official autonomous departments.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={handleOpenAdd}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              color: '#F1C40F',
              border: 'none',
              borderRadius: '8px',
              padding: '0.45rem 0.95rem',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <Plus size={14} /> Add Mapping Rule
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: '0.72rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Source Notation</th>
              <th style={{ padding: '0.75rem 1rem' }}>Target Official Entity</th>
              <th style={{ padding: '0.75rem 1rem' }}>Module Scope</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map(m => (
              <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                  "{m.sourceValueNormalized}"
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ fontWeight: 700, color: '#15803D' }}>{m.targetLabel || m.targetId}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Code: {m.targetId}</div>
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                  <span style={{ background: '#F1F5F9', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                    {m.moduleKey}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '9999px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: m.isActive ? '#ECFDF5' : '#FEF2F2',
                    color: m.isActive ? '#047857' : '#DC2626'
                  }}>
                    {m.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                  {canManage && (
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(m)}
                        style={{ padding: '0.3rem 0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.72rem', cursor: 'pointer' }}
                        title={m.isActive ? 'Disable rule' : 'Enable rule'}
                      >
                        {m.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(m)}
                        style={{ padding: '0.3rem 0.55rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.72rem', cursor: 'pointer' }}
                        title="Edit rule"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(7, 15, 30, 0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
          <form onSubmit={handleSave} style={{ background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '460px', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
              {editingMapping ? 'Edit Alias Rule' : 'Create Alias Rule'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  SOURCE ALIAS NOTATION (RAW TEXT IN UPLOAD)
                </label>
                <input
                  type="text"
                  placeholder="e.g. DS, CS, Cyber, AIML"
                  value={sourceValue}
                  onChange={(e) => setSourceValue(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  MAPS TO OFFICIAL DEPARTMENT
                </label>
                <select
                  value={targetDept}
                  onChange={(e) => setTargetDept(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                >
                  <option value="ALL">Institution Wide / All Departments</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d.code} value={d.name}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  MODULE SCOPE
                </label>
                <select
                  value={moduleKey}
                  onChange={(e) => setModuleKey(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                >
                  <option value="academic_events">Academic Events & Workshops</option>
                  <option value="publications">Research Publications</option>
                  <option value="patents">Patents & IPR</option>
                  <option value="general">Universal (All Modules)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ padding: '0.45rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '0.45rem 1.15rem', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#F1C40F', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Save Rule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
