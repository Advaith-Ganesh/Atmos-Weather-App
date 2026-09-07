import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from '../src/components/ui/SegmentedControl';
import { renderWithUnits } from './helpers/render';

const options = [
  { value: 'c', label: '°C', ariaLabel: 'Celsius' },
  { value: 'f', label: '°F', ariaLabel: 'Fahrenheit' },
] as const;

describe('SegmentedControl', () => {
  it('groups the options under the label it is given', () => {
    renderWithUnits(
      <SegmentedControl options={options} value="c" onChange={vi.fn()} label="Temperature unit" />,
    );
    expect(screen.getByRole('group', { name: 'Temperature unit' })).toBeInTheDocument();
  });

  // aria-pressed is what tells a screen reader which unit is active; the visual
  // highlight alone conveys nothing.
  it('marks only the selected option as pressed', () => {
    renderWithUnits(<SegmentedControl options={options} value="f" onChange={vi.fn()} label="Unit" />);

    expect(screen.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Celsius' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the value that was chosen', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithUnits(<SegmentedControl options={options} value="c" onChange={onChange} label="Unit" />);

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    expect(onChange).toHaveBeenCalledWith('f');
  });

  it('still reports a click on the option already selected', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithUnits(<SegmentedControl options={options} value="c" onChange={onChange} label="Unit" />);

    await user.click(screen.getByRole('button', { name: 'Celsius' }));
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('falls back to the visible text when no aria-label is supplied', () => {
    renderWithUnits(
      <SegmentedControl
        options={[
          { value: 'temp', label: 'Temp' },
          { value: 'rain', label: 'Rain' },
        ]}
        value="temp"
        onChange={vi.fn()}
        label="Chart metric"
      />,
    );
    expect(screen.getByRole('button', { name: 'Rain' })).toBeInTheDocument();
  });

  it('is reachable and operable from the keyboard', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithUnits(<SegmentedControl options={options} value="c" onChange={onChange} label="Unit" />);

    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Fahrenheit' })).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('f');
  });
});
