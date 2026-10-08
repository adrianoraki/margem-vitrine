import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Botao, Chip } from '../src';

describe('componentes', () => {
  it('Botao asChild renderiza o link com o visual do botão', () => {
    render(
      <Botao asChild variante="conversao">
        <a href="/cadastro">Começar grátis</a>
      </Botao>,
    );
    const link = screen.getByRole('link', { name: 'Começar grátis' });
    expect(link.className).toContain('bg-accent');
  });

  it('Chip é toggle acessível', () => {
    const onChange = vi.fn();
    render(
      <Chip selecionado={false} onChange={onChange}>
        Arroz
      </Chip>,
    );
    const chip = screen.getByRole('button', { name: 'Arroz' });
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(chip);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('Entrada', () => {
  it('marca aria-invalid só quando inválida', async () => {
    const { Entrada } = await import('../src');
    const { rerender } = render(<Entrada aria-label="E-mail" invalido={false} />);
    expect(screen.getByLabelText('E-mail').getAttribute('aria-invalid')).toBeNull();
    rerender(<Entrada aria-label="E-mail" invalido />);
    expect(screen.getByLabelText('E-mail').getAttribute('aria-invalid')).toBe('true');
  });
});

describe('cn', () => {
  it('mantém o tamanho do tema ao juntar com uma cor', async () => {
    const { cn } = await import('../src');
    expect(cn('text-caption', 'text-accent')).toBe('text-caption text-accent');
    expect(cn('text-caption', 'text-kpi')).toBe('text-kpi');
  });
});
