// Dropdown options configuration for EditStationModal
export const DROPDOWN_OPTIONS = {
  // Network options
  net: [
    { value: 'IA', label: 'IA' },
    { value: 'II', label: 'II' },
  ],

  // Status options
  status: [
    { value: 'aktif', label: 'Aktif' },
    { value: 'nonaktif', label: 'Nonaktif' },
    { value: 'dismantled', label: 'dismantled' },
  ],

  // Priority options
  prioritas: [
    { value: 'P1', label: 'P1' },
    { value: 'P2', label: 'P2' },
    { value: 'P3', label: 'P3' }
  ],

  // Shelter type options
  tipe_shelter: [
    { value: 'bunker', label: 'Bunker' },
    { value: 'posthole', label: 'Posthole' },
    { value: 'surface', label: 'Surface' }
  ],

  // Shelter location options
  lokasi_shelter: [
    { value: 'outside_BMKG_office', label: 'Outside BMKG Office' },
    { value: 'inside_BMKG_office', label: 'Inside BMKG Office' }
  ],

  // Shelter guard options
  penjaga_shelter: [
    { value: 'ada', label: 'Ada' },
    { value: 'tidak_ada', label: 'Tidak Ada' }
  ],

  // Shelter condition options
  kondisi_shelter: [
    { value: 'baik', label: 'Baik' },
    { value: 'rusak_ringan', label: 'Rusak Ringan' },
    { value: 'rusak_berat', label: 'Rusak Berat' }
  ],

  // Accelerometer options
  accelerometer: [
    { value: 'installed', label: 'Installed' },
    { value: 'not_installed', label: 'Not Installed' }
  ],

  // Communication equipment options
  digitizer_komunikasi: [
    { value: 'installed', label: 'Installed' },
    { value: 'not_installed', label: 'Not Installed' }
  ]
} as const;

// Type for dropdown option
export type DropdownOption = {
  value: string;
  label: string;
};

// Type for dropdown options keys
export type DropdownKey = keyof typeof DROPDOWN_OPTIONS;

// Helper function to get options for a specific field
export const getDropdownOptions = (field: DropdownKey): readonly DropdownOption[] => {
  return DROPDOWN_OPTIONS[field] || [];
};