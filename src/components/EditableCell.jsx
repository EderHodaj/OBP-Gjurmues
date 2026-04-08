// components/EditableCell.jsx — click-to-edit table cell
import { useState, useRef, useEffect } from 'react';

export default function EditableCell({ value, field, rowId, onSave, isHighlighted, display }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState('');
  const inputRef              = useRef(null);

  function startEdit() { setDraft(String(value ?? '')); setEditing(true); }
  useEffect(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [editing]);

  function commit() {
    setEditing(false);
    if (String(draft) !== String(value ?? '')) onSave(rowId, field, draft);
  }

  function handleKey(e) {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
  }

  const isNum = ['fondiLimit','vleraFituesit','nrOfertave','year','vitiShpalljes','vitiVleresimit'].includes(field);

  return (
    <td
      className={`ec ${isHighlighted ? 'ec-hi' : ''} ${editing ? 'ec-active' : ''}`}
      onClick={!editing ? startEdit : undefined}
      title="Klikoni për të redaktuar"
    >
      {editing ? (
        <input
          ref={inputRef}
          type={isNum ? 'number' : 'text'}
          value={draft}
          min={isNum ? '0' : undefined}
          step={field === 'fondiLimit' || field === 'vleraFituesit' ? '0.01' : undefined}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKey}
          className="ec-input"
        />
      ) : (
        <span className={`ec-disp ${isNum ? 'ec-num' : ''}`}>
          {display ?? (value ?? '')}
          <span className="ec-hint" aria-hidden="true">✎</span>
        </span>
      )}
    </td>
  );
}
