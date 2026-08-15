import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { SortableCartIngredientItem } from './SortableCartIngredientItem';

function renderItem(overrides: Partial<Parameters<typeof SortableCartIngredientItem>[0]> = {}) {
  const onRename = vi.fn();
  render(
    <DndContext>
      <SortableContext items={['beurre']}>
        <ul>
          <SortableCartIngredientItem
            id="beurre"
            name="Beurre"
            details="200 g"
            checked={false}
            onToggle={() => {}}
            onRemove={() => {}}
            onRename={onRename}
            {...overrides}
          />
        </ul>
      </SortableContext>
    </DndContext>,
  );
  return { onRename };
}

/** Opens the editor and returns the input, pre-filled with the whole line. */
function startEditing() {
  fireEvent.click(screen.getByTitle("Modifier l'article"));
  return screen.getByLabelText("Modifier l'article") as HTMLInputElement;
}

describe('SortableCartIngredientItem', () => {
  it('shows the quantity and the name on one line', () => {
    renderItem();
    expect(screen.getByTitle("Modifier l'article")).toHaveTextContent('200 g Beurre');
  });

  it('edits the whole line, quantity included', () => {
    const { onRename } = renderItem();
    const input = startEditing();
    expect(input.value).toBe('200 g Beurre');

    fireEvent.change(input, { target: { value: '250 g Beurre demi-sel' } });
    fireEvent.blur(input);

    expect(onRename).toHaveBeenCalledWith('beurre', '250 g Beurre demi-sel');
    expect(screen.getByTitle("Modifier l'article")).toBeInTheDocument();
  });

  it('keeps the original label when Escape is pressed', () => {
    const { onRename } = renderItem();
    const input = startEditing();

    fireEvent.change(input, { target: { value: 'Margarine' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.blur(input);

    expect(onRename).not.toHaveBeenCalled();
  });

  it('ignores a blank or unchanged label', () => {
    const { onRename } = renderItem();

    const blank = startEditing();
    fireEvent.change(blank, { target: { value: '   ' } });
    fireEvent.blur(blank);

    const unchanged = startEditing();
    fireEvent.blur(unchanged);

    expect(onRename).not.toHaveBeenCalled();
  });
});
