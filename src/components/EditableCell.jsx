// EditableCell — click to edit
// Tab/Shift+Tab = next/prev column, Enter = next row, ↑↓ = move rows, Ctrl+Z = undo
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

  function startEdit() { setDraft(String(value ?? '')); setEditing(true); }

  useEffect(() => {
    if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editing]);

  function commit() {
    setEditing(false);
    if (String(draft) !== String(value ?? '')) onSave(rowId, field, draft);
  }

  function handleKey(e) {
    // Notes field (textarea): Enter adds newline, Shift+Enter or Escape commits
    if (field === 'notes') {
      if (e.key === 'Escape') { e.preventDefault(); commit(); }
      return; // let Enter/Tab work normally in textarea
    }

    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      commit();
      if (onNavigate) {
        if (e.key === 'Tab') {
          const nextCol = e.shiftKey ? colIndex - 1 : colIndex + 1;
          if (nextCol >= 0 && nextCol < totalCols)       onNavigate(rowIndex, nextCol);
          else if (!e.shiftKey && rowIndex + 1 < totalRows) onNavigate(rowIndex + 1, 0);
          else if (e.shiftKey  && rowIndex > 0)          onNavigate(rowIndex - 1, totalCols - 1);
        } else {
          // Enter → same col, next row
          if (rowIndex + 1 < totalRows) onNavigate(rowIndex + 1, colIndex);
        }
      }
    }
    if (e.key === 'Escape') setEditing(false);
    if (e.key === 'ArrowDown' && onNavigate) { e.preventDefault(); commit(); onNavigate(rowIndex + 1, colIndex); }
    if (e.key === 'ArrowUp'   && onNavigate) { e.preventDefault(); commit(); onNavigate(rowIndex - 1, colIndex); }
  }

  const isNum   = ['fondiLimit','vleraFituesit','nrOfertave','nrOperatoreve',
                    'year','vitiShpalljes','vitiVleresimit'].includes(field);
  const isNotes = field === 'notes';

  // Display value: truncate notes for readability
  function displayValue() {
    if (display !== undefined) return display;
    if (isNotes && value && String(value).length > 40)
      return String(value).slice(0, 40) + '…';
    return value ?? '';
  }

  return (
    <td
      className={`ec ${isHighlighted ? 'ec-hi' : ''} ${editing ? 'ec-active' : ''} ${isNotes ? 'ec-notes' : ''}`}
      onClick={!editing ? startEdit : undefined}
      title={isNotes ? (value || 'Klikoni për të shtuar shënime') : 'Klikoni për të redaktuar (Tab=kolona, ↑↓=rreshti)'}
    >
      {editing ? (
        isNotes ? (
          // Notes uses a textarea for multi-line
          <textarea
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKey}
            className="ec-textarea"
            rows={3}
            placeholder="Shkruani shënime…"
          />
        ) : (
          <input
            ref={inputRef}
            type={isNum ? 'number' : 'text'}
            value={draft}
            min={isNum ? '0' : undefined}
            step={['fondiLimit','vleraFituesit'].includes(field) ? '0.01' : undefined}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKey}
            className="ec-input"
          />
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
