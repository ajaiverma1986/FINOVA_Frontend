import { useLayoutEffect, useRef } from 'react';

export function maskIdentifier(value: string) {
  return '*'.repeat(Math.max(0, value.length - 4)) + value.slice(-4);
}

export default function MaskedIdentifierInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const selection = useRef({ start: 0, end: 0 });
  const caret = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (caret.current !== null && input.current === document.activeElement) {
      input.current?.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  });
  function rememberSelection() {
    selection.current = {
      start: input.current?.selectionStart ?? 0,
      end: input.current?.selectionEnd ?? 0,
    };
  }
  return (
    <input
      ref={input}
      type="text"
      autoComplete="off"
      spellCheck={false}
      value={maskIdentifier(value)}
      onSelect={rememberSelection}
      onKeyDown={rememberSelection}
      onBeforeInput={rememberSelection}
      onPaste={rememberSelection}
      onChange={(event) => {
        const edited = event.target.value;
        const position = event.target.selectionStart ?? edited.length;
        const { start, end } = selection.current;
        const insertedLength = edited.length - (value.length - (end - start));
        let next: string;
        if (insertedLength >= 0) {
          next =
            value.slice(0, start) +
            edited.slice(position - insertedLength, position) +
            value.slice(end);
        } else {
          // Backspace/Delete without a selection: the new caret identifies the removed range.
          next = value.slice(0, position) + value.slice(position - insertedLength);
        }
        caret.current = position;
        selection.current = { start: position, end: position };
        onChange(next);
      }}
    />
  );
}
