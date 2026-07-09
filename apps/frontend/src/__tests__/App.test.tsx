import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';

describe('App', () => {
  it('renders the starter shell and API status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'Hello World!',
      }),
    );

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Fullstack Monorepo' })).toBeTruthy();
    expect(await screen.findByText('API: Hello World!')).toBeTruthy();
  });
});
