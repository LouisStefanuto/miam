import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { useScrollDirection } from './use-scroll-direction';

function Bar() {
  const { hidden } = useScrollDirection();
  const navigate = useNavigate();
  return (
    <>
      <span data-testid="bar">{hidden ? 'hidden' : 'shown'}</span>
      <button onClick={() => navigate('/')}>recipes</button>
    </>
  );
}

function scrollWindowTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
  act(() => {
    window.dispatchEvent(new Event('scroll'));
  });
}

const bar = () => screen.getByTestId('bar').textContent;

describe('useScrollDirection', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
  });

  it('hides the bar when the user scrolls down', () => {
    render(<MemoryRouter initialEntries={['/cart']}><Bar /></MemoryRouter>);
    scrollWindowTo(0);
    scrollWindowTo(300);
    expect(bar()).toBe('hidden');
  });

  it('keeps the bar shown when a route change moves the window', () => {
    render(<MemoryRouter initialEntries={['/cart']}><Bar /></MemoryRouter>);
    scrollWindowTo(0);

    // Back on the catalog, which jumps down to where the user left it.
    fireEvent.click(screen.getByText('recipes'));
    scrollWindowTo(3000);
    expect(bar()).toBe('shown');

    // Scrolling down from there still hides it.
    scrollWindowTo(3100);
    expect(bar()).toBe('hidden');
  });
});
