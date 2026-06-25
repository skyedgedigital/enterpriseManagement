/** Shared fleet WO unit presets (create + edit forms). */
export const FLEET_WO_UNIT_PRESETS: { value: string; label: string }[] = [
  { value: 'months', label: 'Months' },
  { value: 'days', label: 'Days' },
  { value: 'shift', label: 'Shift' },
  { value: 'hours', label: 'Hours' },
  { value: 'ot', label: 'Over time' },
];

export const FLEET_WO_PRESET_VALUES = new Set(
  FLEET_WO_UNIT_PRESETS.map((p) => p.value),
);


export const MAX_CHALAN_FILE_BYTES = 5_000_000;
export const CHALAN_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const;
