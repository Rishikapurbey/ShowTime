import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dropdown from './Dropdown';

const OPTIONS = [
  { key: 'added', label: 'Recently added' },
  { key: 'oldest', label: 'Oldest added' },
  { key: 'title', label: 'Title (A–Z)' },
];

const setup = (initial = 'added') => {
  const onChange = vi.fn();
  const Harness = () => {
    const [value, setValue] = useState(initial);
    return (
      <>
        <Dropdown
          label="Sort"
          options={OPTIONS}
          value={value}
          onChange={(key) => { onChange(key); setValue(key); }}
        />
        <button>Elsewhere</button>
      </>
    );
  };
  render(<Harness />);
  return { onChange, trigger: screen.getByRole('combobox', { name: 'Sort' }) };
};

const activeOption = (trigger) => document.getElementById(trigger.getAttribute('aria-activedescendant'));

describe('Dropdown', () => {
  it('stays closed until clicked, then marks the current choice', async () => {
    const { trigger } = setup('oldest');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { selected: true })).toHaveTextContent('Oldest added');
    expect(activeOption(trigger)).toHaveTextContent('Oldest added');
  });

  it('selects a clicked option, closes and keeps focus', async () => {
    const { trigger, onChange } = setup();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('option', { name: 'Title (A–Z)' }));
    expect(onChange).toHaveBeenCalledWith('title');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('does not report a change when the current option is picked again', async () => {
    const { trigger, onChange } = setup();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('option', { name: 'Recently added' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('closes when clicking the button again or anywhere else', async () => {
    const { trigger } = setup();
    await userEvent.click(trigger);
    await userEvent.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await userEvent.click(trigger);
    await userEvent.click(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('works from the keyboard', async () => {
    const { trigger, onChange } = setup();
    await userEvent.tab();
    expect(trigger).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(activeOption(trigger)).toHaveTextContent('Recently added');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(activeOption(trigger)).toHaveTextContent('Title (A–Z)');
    await userEvent.keyboard('{Home}');
    expect(activeOption(trigger)).toHaveTextContent('Recently added');
    await userEvent.keyboard('{End}{Enter}');
    expect(onChange).toHaveBeenCalledWith('title');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('selects with Space without reopening', async () => {
    const { trigger, onChange } = setup();
    trigger.focus();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{ArrowDown} ');
    expect(onChange).toHaveBeenCalledWith('oldest');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes on Escape without changing the value', async () => {
    const { trigger, onChange } = setup();
    trigger.focus();
    await userEvent.keyboard('{Enter}{ArrowDown}{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it('closes when tabbing away', async () => {
    const { trigger } = setup();
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Elsewhere' })).toHaveFocus();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('jumps to an option by typing its first letters', async () => {
    const { trigger } = setup();
    trigger.focus();
    await userEvent.keyboard('ti');
    expect(activeOption(trigger)).toHaveTextContent('Title (A–Z)');
  });
});
