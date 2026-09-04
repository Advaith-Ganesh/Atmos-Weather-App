import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from '../src/components/search/SearchBar';

describe('SearchBar', () => {
  it('rejects an empty search without calling the API layer', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);

    await user.click(screen.getByRole('searchbox', { name: /search for a location/i }));
    await user.keyboard('{Enter}');

    expect(onSearch).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(/city, postcode or country/i);
  });

  it('rejects input containing markup', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox'), '<script>{Enter}');

    expect(onSearch).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('submits a normalised query', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox'), '  Paris,   France  {Enter}');

    expect(onSearch).toHaveBeenCalledWith('Paris, France');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('clears the error as soon as the user edits the field again', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={vi.fn()} />);
    const input = screen.getByRole('searchbox');

    await user.type(input, '---{Enter}');
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await user.type(input, 'London');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('offers a clear button once there is something to clear', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={vi.fn()} />);
    const input = screen.getByRole('searchbox');

    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();

    await user.type(input, 'Tokyo');
    await user.click(screen.getByRole('button', { name: /clear search/i }));

    expect(input).toHaveValue('');
  });

  it('shows the loaded location in the placeholder', () => {
    render(<SearchBar onSearch={vi.fn()} currentLocation="Dubai" />);
    expect(screen.getByRole('searchbox')).toHaveAttribute('placeholder', expect.stringContaining('Dubai'));
  });
});
