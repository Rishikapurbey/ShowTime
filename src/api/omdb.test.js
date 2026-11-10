import { describe, it, expect } from 'vitest';
import { wrapTitle, placeholderPoster, posterOrPlaceholder, showPlaceholderOnError } from './omdb';

const svgOf = (dataUrl) => decodeURIComponent(dataUrl.replace('data:image/svg+xml;utf8,', ''));

describe('wrapTitle', () => {
  it('fits words onto lines of at most 16 characters', () => {
    expect(wrapTitle('Clue: A Love Thriller')).toEqual(['Clue: A Love', 'Thriller']);
  });

  it('hard-splits a single very long word', () => {
    expect(wrapTitle('Supercalifragilisticexpialidocious')).toEqual(['Supercalifragili', 'sticexpialidocio', 'us']);
  });

  it('cuts off with an ellipsis after four lines', () => {
    const lines = wrapTitle('The Lord of the Rings The Fellowship of the Ring Extended Edition');
    expect(lines).toHaveLength(4);
    expect(lines[3].endsWith('…')).toBe(true);
    lines.forEach((line) => expect(line.length).toBeLessThanOrEqual(16));
  });
});

describe('placeholderPoster', () => {
  it('draws the title', () => {
    expect(svgOf(placeholderPoster('The Dark Knight'))).toContain('>The Dark Knight</tspan>');
  });

  it('escapes characters that would break the SVG', () => {
    const svg = svgOf(placeholderPoster('Tom & Jerry <3'));
    expect(svg).toContain('Tom &amp; Jerry');
    expect(svg).toContain('&lt;3');
  });

  it('says "No poster" when there is no title', () => {
    expect(svgOf(placeholderPoster())).toContain('>No poster</tspan>');
  });
});

describe('posterOrPlaceholder', () => {
  it('keeps a real poster URL', () => {
    expect(posterOrPlaceholder('https://example.com/p.jpg', 'Up')).toBe('https://example.com/p.jpg');
  });

  it('uses a titled placeholder when OMDb has no poster', () => {
    expect(svgOf(posterOrPlaceholder('N/A', 'Up'))).toContain('>Up</tspan>');
  });
});

describe('showPlaceholderOnError', () => {
  it('swaps a broken poster for one titled from the alt text, only once', () => {
    const img = document.createElement('img');
    img.alt = 'Dune';
    showPlaceholderOnError({ currentTarget: img });
    const first = img.src;
    expect(svgOf(first)).toContain('>Dune</tspan>');

    img.alt = 'Changed';
    showPlaceholderOnError({ currentTarget: img });
    expect(img.src).toBe(first);
  });
});
