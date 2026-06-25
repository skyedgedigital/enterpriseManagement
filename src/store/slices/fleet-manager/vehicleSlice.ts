import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Vehicle } from '@/types';
import { vehicleService } from '@/services/fleet-manger/vehicle.service';

interface VehicleState {
  items: Vehicle[];
  selectedItem: Vehicle | null;
  loading: boolean;
  error: string | null;
}

const initialState: VehicleState = {
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
};

export const fetchVehicles = createAsyncThunk(
  'vehicles/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await vehicleService.getAll();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch vehicles',
      );
    }
  },
);

export const fetchVehicleById = createAsyncThunk(
  'vehicles/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await vehicleService.getById(id);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch vehicle',
      );
    }
  },
);

export const addVehicle = createAsyncThunk(
  'vehicles/add',
  async (
    data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>,
    { rejectWithValue },
  ) => {
    try {
      return await vehicleService.create(data);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to add vehicle',
      );
    }
  },
);

export const updateVehicle = createAsyncThunk(
  'vehicles/update',
  async (
    { id, data }: { id: string; data: Partial<Vehicle> },
    { rejectWithValue },
  ) => {
    try {
      await vehicleService.update(id, data);
      return { id, ...data };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update vehicle',
      );
    }
  },
);

export const deleteVehicle = createAsyncThunk(
  'vehicles/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await vehicleService.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete vehicle',
      );
    }
  },
);

const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    clearVehicleError(state) {
      state.error = null;
    },
    clearSelectedVehicle(state) {
      state.selectedItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchVehicleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchVehicleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addVehicle.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(addVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVehicle.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      .addCase(updateVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((i) => i.id !== action.payload);
      })
      .addCase(deleteVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearVehicleError, clearSelectedVehicle } = vehicleSlice.actions;
export default vehicleSlice.reducer;
