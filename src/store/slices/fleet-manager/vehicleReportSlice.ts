// @/store/slices/fleet-manager/vehicleReportSlice.ts

import { vehicleReportService } from '@/services/fleet-manger/vehicleReport.service';
import type { VehicleReportRow } from '@/types';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface VehicleReportState {
  reportRows: VehicleReportRow[];
  loading: boolean;
  error: string | null;
}

const initialState: VehicleReportState = {
  reportRows: [],
  loading: false,
  error: null,
};

export const fetchVehicleReport = createAsyncThunk(
  'vehicleReport/fetch',
  async (
    params: { startDate: Date; endDate: Date; vehicleNumber?: string },
    { rejectWithValue },
  ) => {
    try {
      return await vehicleReportService.getReport(
        params.startDate,
        params.endDate,
        params.vehicleNumber,
      );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to fetch vehicle report',
      );
    }
  },
);

const vehicleReportSlice = createSlice({
  name: 'vehicleReport',
  initialState,
  reducers: {
    clearVehicleReport(state) {
      state.reportRows = [];
      state.error = null;
    },
    clearVehicleReportError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicleReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reportRows = action.payload;
      })
      .addCase(fetchVehicleReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearVehicleReport, clearVehicleReportError } =
  vehicleReportSlice.actions;
export default vehicleReportSlice.reducer;
