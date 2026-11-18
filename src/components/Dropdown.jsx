import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import './Dropdown.css';

const MENU_GAP = 6;
const TYPE_AHEAD_RESET_MS = 500;

const defaultRenderOption = (option) => option.label;

// A styled replacement for <select>, built as an ARIA select-only combobox: focus stays on
// the button and aria-activedescendant points at the highlighted option.
// `options` is a list of { key, label }; `value` is the selected key.
const Dropdown = ({ label, options, value, onChange, renderOption = defaultRenderOption }) => {
  const id = useId();
  const labelId = `${id}-label`;
  const listId = `${id}-list`;
  const optionId = (index) => `${id}-option-${index}`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [opensUp, setOpensUp] = useState(false);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const typed = useRef({ text: '', timer: null });

  const selectedIndex = Math.max(0, options.findIndex((o) => o.key === value));

  // Open upwards when the menu would run off the bottom of the screen and fits above.
  useLayoutEffect(() => {
    if (!open) return;
    const { top, bottom } = triggerRef.current.getBoundingClientRect();
    const needed = listRef.current.offsetHeight + MENU_GAP;
    setOpensUp(bottom + needed > window.innerHeight && top > needed);
  }, [open]);

  const openMenu = (index = selectedIndex) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const choose = (option) => {
    setOpen(false);
    if (option.key !== value) onChange(option.key);
  };

  const typeAhead = (char) => {
    clearTimeout(typed.current.timer);
    typed.current.text += char.toLowerCase();
    typed.current.timer = setTimeout(() => { typed.current.text = ''; }, TYPE_AHEAD_RESET_MS);
    const match = options.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.text));
    if (match !== -1) openMenu(match);
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const { key } = e;
    const isConfirm = key === 'Enter' || key === ' ';
    const last = options.length - 1;
    const moves = {
      ArrowDown: Math.min(activeIndex + 1, last),
      ArrowUp: Math.max(activeIndex - 1, 0),
      Home: 0,
      End: last,
    };

    if (key.length === 1 && key !== ' ') {
      typeAhead(key);
    } else if (!open) {
      if (!isConfirm && key !== 'ArrowDown' && key !== 'ArrowUp') return;
      openMenu();
    } else if (key in moves) {
      setActiveIndex(moves[key]);
    } else if (isConfirm) {
      choose(options[activeIndex]);
    } else if (key === 'Escape') {
      setOpen(false);
    } else {
      return;
    }
    e.preventDefault();
  };

  return (
    <div className={`dropdown ${open ? 'open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        className="dropdown-trigger"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? optionId(activeIndex) : undefined}
        // While open, pressing the button must not blur it (Safari does), or the click would reopen it.
        onMouseDown={(e) => { if (open) e.preventDefault(); }}
        onClick={(e) => {
          // Safari doesn't focus buttons on click, and closing on blur relies on focus.
          e.currentTarget.focus();
          if (open) setOpen(false);
          else openMenu();
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        // Some browsers still click a button on Space's keyup after keydown was handled.
        onKeyUp={(e) => { if (e.key === ' ') e.preventDefault(); }}
      >
        <span id={labelId} className="dropdown-label">{label}</span>
        {/* Every option is stacked here, so the button is as wide as the longest one. */}
        <span className="dropdown-value">
          {options.map((option, index) => (
            <span key={option.key} aria-hidden={index !== selectedIndex} className={index === selectedIndex ? '' : 'dropdown-sizer'}>
              {renderOption(option)}
            </span>
          ))}
        </span>
        <svg className="dropdown-chevron" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={labelId}
          className={`dropdown-menu ${opensUp ? 'up' : ''}`}
          // Keeps focus on the button, so clicking an option doesn't close the menu first.
          onMouseDown={(e) => e.preventDefault()}
        >
          {options.map((option, index) => (
            <li
              key={option.key}
              id={optionId(index)}
              role="option"
              aria-selected={index === selectedIndex}
              className={`dropdown-option ${index === activeIndex ? 'active' : ''}`}
              onClick={() => choose(option)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <span>{renderOption(option)}</span>
              {index === selectedIndex && (
                <svg className="dropdown-check" viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="8" cy="8" r="8" />
                  <path d="m4.8 8.2 2.2 2.2 4.2-4.6" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
