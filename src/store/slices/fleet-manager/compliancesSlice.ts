// @/store/slices/fleet-manager/complianceSlice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Compliance } from '@/types';
import { complianceService } from '@/services/fleet-manger/compliances.service';

interface ComplianceState {
  compliances: Compliance[];
  loading: boolean;
  error: string | null;
}

const initialState: ComplianceState = {
  compliances: [],
  loading: false,
  error: null,
};

// Fetch ALL — default page load
export const fetchAllCompliances = createAsyncThunk(
  'compliances/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await complianceService.getAll();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch compliances',
      );
    }
  },
);

// Fetch filtered
export const fetchFilteredCompliances = createAsyncThunk(
  'compliances/fetchFiltered',
  async (
    filters: {
      vehicleNumber?: string;
      complianceType?: string;
      year?: number;
      month?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      return await complianceService.getFiltered(filters);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch compliances',
      );
    }
  },
);

export const addCompliance = createAsyncThunk(
  'compliances/add',
  async (data: Omit<Compliance, 'id'>, { rejectWithValue }) => {
    try {
      return await complianceService.create(data);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to add compliance',
      );
    }
  },
);

export const deleteCompliance = createAsyncThunk(
  'compliances/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await complianceService.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete compliance',
      );
    }
  },
);

const complianceSlice = createSlice({
  name: 'compliances',
  initialState,
  reducers: {
    clearCompliances(state) {
      state.compliances = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchAllCompliances.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllCompliances.fulfilled, (state, action) => {
        state.loading = false;
        state.compliances = action.payload;
      })
      .addCase(fetchAllCompliances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchFiltered
      .addCase(fetchFilteredCompliances.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFilteredCompliances.fulfilled, (state, action) => {
        state.loading = false;
        state.compliances = action.payload;
      })
      .addCase(fetchFilteredCompliances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // add
      .addCase(addCompliance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCompliance.fulfilled, (state, action) => {
        state.loading = false;
        state.compliances.unshift(action.payload);
      })
      .addCase(addCompliance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // delete
      .addCase(deleteCompliance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCompliance.fulfilled, (state, action) => {
        state.loading = false;
        state.compliances = state.compliances.filter(
          (c) => c.id !== action.payload,
        );
      })
      .addCase(deleteCompliance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCompliances } = complianceSlice.actions;
export default complianceSlice.reducer;
