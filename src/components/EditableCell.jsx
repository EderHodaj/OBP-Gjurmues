import { useState, useRef, useEffect } from 'react';

export default function EditableCell({
  value, field, rowId, onSave, isHighlighted, display,
  rowIndex, colIndex, totalRows, totalCols, onNavigate, cellRef,
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');
  const inputRef              = useRef(null);

  // Register focus trigger for keyboard navigation
  useEffect(() => {
    if (cellRef) cellRef.current = { focus: () => { setDraft(String(value ?? '')); setEditing(true); } };
  });

  function startEdit() {
    // onSave is a no-op () => {} for viewers — still allow click but commit does nothing
    setDraft(String(value ?? ''));
    setEditing(true);
  }

  useEffect(() => {
    if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editing]);

  function commit() {
    setEditing(false);
    if (String(draft) !== String(value ?? '')) onSave(rowId, field, draft);
  }

  function handleKey(e) {
    const isNotes = field === 'notes';
    if (isNotes) {
      if (e.key === 'Escape') { e.preventDefault(); commit(); }
      return;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      commit();
      if (onNavigate) {
        if (e.key === 'Tab') {
          const nc = e.shiftKey ? colIndex - 1 : colIndex + 1;
          if (nc >= 0 && nc < totalCols)              onNavigate(rowIndex, nc);
          else if (!e.shiftKey && rowIndex + 1 < totalRows) onNavigate(rowIndex + 1, 0);
          else if (e.shiftKey  && rowIndex > 0)        onNavigate(rowIndex - 1, totalCols - 1);
        } else {
          if (rowIndex + 1 < totalRows) onNavigate(rowIndex + 1, colIndex);
        }
      }
    }
    if (e.key === 'Escape') setEditing(false);
    if (e.key === 'ArrowDown' && onNavigate) { e.preventDefault(); commit(); onNavigate(rowIndex + 1, colIndex); }
    if (e.key === 'ArrowUp'   && onNavigate) { e.preventDefault(); commit(); onNavigate(rowIndex - 1, colIndex); }
  }

  const isNum   = ['fondiLimit','vleraFituesit','nrOfertave','nrOperatoreve','year','vitiShpalljes','vitiVleresimit'].includes(field);
  const isNotes = field === 'notes';

  function displayValue() {
    if (display !== undefined) return display;
    if (isNotes && value && String(value).length > 40) return String(value).slice(0, 40) + '…';
    return value ?? '';
  }

  return (
    <td
      className={`ec ${isHighlighted ? 'ec-hi' : ''} ${editing ? 'ec-active' : ''} ${isNotes ? 'ec-notes' : ''}`}
      onClick={!editing ? startEdit : undefined}
      title={isNotes ? (value || 'Klikoni për shënime') : 'Klikoni për të redaktuar'}
    >
      {editing ? (
        isNotes ? (
          <textarea ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)}
            onBlur={commit} onKeyDown={handleKey} className="ec-textarea" rows={3} placeholder="Shkruani shënime…" />
        ) : (
          <input ref={inputRef} type={isNum ? 'number' : 'text'} value={draft}
            min={isNum ? '0' : undefined}
            step={['fondiLimit','vleraFituesit'].includes(field) ? '0.01' : undefined}
            onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={handleKey} className="ec-input" />
        )
      ) : (
        <span className={`ec-disp ${isNum ? 'ec-num' : ''} ${isNotes ? 'ec-notes-disp' : ''}`}>
          {displayValue()}
          <span className="ec-hint" aria-hidden="true">{isNotes ? '📝' : '✎'}</span>
        </span>
      )}
    </td>
  );
}
