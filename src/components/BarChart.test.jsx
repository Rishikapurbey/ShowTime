import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BarChart from './BarChart';

const ROWS = [
  { key: 5, label: '5 ★', value: 2, detail: 'movies · 40% of rated' },
  { key: 4, label: '4 ★', value: 3, detail: 'movies · 60% of rated' },
  { key: 3, label: '3 ★', value: 0, detail: 'movies · 0% of rated' },
];

const renderChart = () => render(<BarChart id="test" title="Your ratings" rows={ROWS} />);
const bars = () => screen.getAllByRole('listitem');

describe('BarChart', () => {
  it('describes every bar for screen readers', () => {
    renderChart();
    expect(screen.getByRole('figure', { name: 'Your ratings' })).toBeInTheDocument();
    expect(bars().map((b) => b.getAttribute('aria-label'))).toEqual([
      '5 ★: 2 movies · 40% of rated',
      '4 ★: 3 movies · 60% of rated',
      '3 ★: 0 movies · 0% of rated',
    ]);
  });

  it('sizes bars relative to the largest and draws nothing for zero', () => {
    const { container } = renderChart();
    const tracks = container.querySelectorAll('.bar-track');
    expect(tracks[0].style.getPropertyValue('--fraction')).toBe(String(2 / 3));
    expect(tracks[1].style.getPropertyValue('--fraction')).toBe('1');
    expect(tracks[2].querySelector('.bar')).toBeNull();
  });

  it('labels only the largest bar', () => {
    const { container } = renderChart();
    const labels = container.querySelectorAll('.bar-value');
    expect(labels).toHaveLength(1);
    expect(labels[0]).toHaveTextContent('3');
  });

  it('shows a value tooltip on hover and on keyboard focus', async () => {
    renderChart();
    await userEvent.hover(bars()[0]);
    expect(within(bars()[0]).getByText('2')).toBeInTheDocument();
    expect(bars()[0]).toHaveTextContent('movies · 40% of rated');

    await userEvent.unhover(bars()[0]);
    expect(bars()[0]).not.toHaveTextContent('40%');

    await userEvent.tab(); // the toggle button
    await userEvent.tab(); // the first bar
    expect(bars()[0]).toHaveFocus();
    expect(bars()[0]).toHaveTextContent('movies · 40% of rated');
  });

  it('switches to a table listing every value', async () => {
    renderChart();
    await userEvent.click(screen.getByRole('button', { name: 'Show table' }));
    const rows = screen.getAllByRole('row').map((r) => r.textContent);
    expect(rows).toEqual(['5 ★2movies · 40% of rated', '4 ★3movies · 60% of rated', '3 ★0movies · 0% of rated']);

    await userEvent.click(screen.getByRole('button', { name: 'Show chart' }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('labels every bar tied for the largest value', () => {
    const { container } = render(
      <BarChart
        id="t"
        title="Tied"
        rows={[
          { key: 1, label: 'a', value: 4, detail: 'movies' },
          { key: 2, label: 'b', value: 2, detail: 'movies' },
          { key: 3, label: 'c', value: 4, detail: 'movies' },
        ]}
      />
    );
    expect([...container.querySelectorAll('.bar-value')].map((l) => l.textContent)).toEqual(['4', '4']);
  });

  it("doesn't label anything when every value is zero", () => {
    const { container } = render(
      <BarChart id="z" title="Empty" rows={[{ key: 1, label: 'a', value: 0, detail: 'movies' }]} />
    );
    expect(container.querySelector('.bar-value')).toBeNull();
  });
});
