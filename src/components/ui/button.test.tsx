import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { T } from "@/components/Translate";

// Component test (K) for the shared Button primitive.
// Run with: pnpm test:component
describe('Button', () => {
  it('renders its label', () => {
    render(<Button>{/* @ts-ignore */}<T>Save</T></Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>{/* @ts-ignore */}<T>Click</T></Button>);
    screen.getByRole('button', { name: 'Click' }).click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies the danger variant class', () => {
    render(<Button variant="danger">{/* @ts-ignore */}<T>Delete</T></Button>);
    const btn = screen.getByRole('button', { name: 'Delete' });
    expect(btn).toHaveClass('text-[var(--rose)]');
    expect(btn).toHaveClass('border');
  });

  it('is disabled when the disabled prop is set', () => {
    render(<Button disabled>{/* @ts-ignore */}<T>Off</T></Button>);
    expect(screen.getByRole('button', { name: 'Off' })).toBeDisabled();
  });
});
