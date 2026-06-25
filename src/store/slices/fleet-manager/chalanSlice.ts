import {
  fleetChalanService,
  type FleetChalanUpdatePayload,
} from '@/services/fleet-manger/chalan.service';
import type { Chalan } from '@/types';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { ChalanFormValues } from '@/lib/fleet-manager/validators';
interface ChalanState {
  chalans: Chalan[];
  selectedChalan: Chalan | null;
  loading: boolean;
  error: string | null;
}

const initialState: ChalanState = {
  chalans: [],
  selectedChalan: null,
  loading: false,
  error: null,
};

export const createFleetChalan = createAsyncThunk(
  'fleetChalans/create',
  async (
    payload: { form: ChalanFormValues; driverUid: string },
    { rejectWithValue },
  ) => {
    try {
      return await fleetChalanService.createChalan(payload);
    } catch (e) {
      return rejectWithValue(
        e instanceof Error ? e.message : 'Failed to create chalan',
      );
    }
  },
);

export const fetchFleetChalans = createAsyncThunk(
  'fleetChalans/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fleetChalanService.getAll();
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Fetch failed');
    }
  },
);

export const fetchFleetChalanById = createAsyncThunk(
  'fleetChalans/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await fleetChalanService.getById(id);
    } catch (e) {
      return rejectWithValue(
        e instanceof Error ? e.message : 'Failed to fetch chalan',
      );
    }
  },
);

export const updateFleetChalan = createAsyncThunk(
  'fleetChalans/update',
  async (
    payload: { id: string; patch: FleetChalanUpdatePayload },
    { rejectWithValue },
  ) => {
    try {
      return await fleetChalanService.update(payload.id, payload.patch);
    } catch (e) {
      return rejectWithValue(
        e instanceof Error ? e.message : 'Failed to fetch chalan',
      );
    }
  },
);

export const deleteFleetChalan = createAsyncThunk(
  'fleetChalans/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await fleetChalanService.remove(id);
      return id;
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Delete failed');
    }
  },
);

const fleetChalanSlice = createSlice({
  name: 'fleetChalans',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSelected(state) {
      state.selectedChalan = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFleetChalans.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFleetChalans.fulfilled, (state, action) => {
        state.loading = false;
        state.chalans = action.payload;
      })
      .addCase(fetchFleetChalans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createFleetChalan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFleetChalan.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createFleetChalan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateFleetChalan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFleetChalan.fulfilled, (state, action) => {
        state.loading = false;
        const c = action.payload;
        const idx = state.chalans.findIndex((row) => row.id === c.id);
        if (idx !== -1) state.chalans[idx] = c;
        else state.chalans = [c, ...state.chalans];
        if (state.selectedChalan?.id === c.id) state.selectedChalan = c;
      })
      .addCase(updateFleetChalan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteFleetChalan.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFleetChalan.fulfilled, (state, action) => {
        state.loading = false;
        const id = action.payload;
        state.chalans = state.chalans.filter((row) => row.id !== id);
        if (state.selectedChalan?.id === id) state.selectedChalan = null;
      })
      .addCase(deleteFleetChalan.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});
export const {
  clearError: clearFleetChalanError,
  clearSelected: clearFleetSelectedChalan,
} = fleetChalanSlice.actions;

export default fleetChalanSlice.reducer;
