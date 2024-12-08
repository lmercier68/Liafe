import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Palette } from 'lucide-react';
import { CARD_COLORS } from '../store/cardStore';

interface ColorPickerProps {
  onColorSelect: (color: string) => void;
  currentColor: string;
}

export function ColorPicker({ onColorSelect, currentColor }: ColorPickerProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className="p-1 hover:bg-gray-100 rounded"
          title="Change color"
        >
          <Palette size={18} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="rounded-lg p-2 bg-white shadow-xl border border-gray-200 grid grid-cols-5 gap-1 w-[160px]"
          sideOffset={5}
        >
          {Object.entries(CARD_COLORS).map(([color, className]) => (
            <button
              key={color}
              onClick={() => onColorSelect(color)}
              className={`w-6 h-6 rounded ${className} ${
                currentColor === color ? 'ring-2 ring-indigo-500' : ''
              }`}
            />
          ))}
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}