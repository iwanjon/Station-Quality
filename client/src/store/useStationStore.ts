import { create } from 'zustand';

// 1. Define the type for the data (copied from your component)
export interface QCSummary {
  code: string;
  quality_percentage: number | null;
  result: string;
}

// 2. Define the shape of the Store
interface StationState {
  qcSummaryData: QCSummary[];
  setQcSummaryData: (data: QCSummary[]) => void;
}

// 3. Create the hook
export const useStationStore = create<StationState>((set) => ({
  qcSummaryData: [], // Initial value
  setQcSummaryData: (data) => set({ qcSummaryData: data }), // The action to update it
}));