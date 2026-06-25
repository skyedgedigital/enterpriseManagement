import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Consumable } from '@/types';
import type { ConsumableFormValues } from '@/lib/fleet-manager/validators';
import { consumableService } from '@/services/fleet-manger/consumables.service';

interface ConsumableState {
  items: Consumable[];
  selectedConsumable: Consumable | null;
  loading: boolean;
  error: string | null;
}

const initialState: ConsumableState = {
  items: [],
  selectedConsumable: null,
  loading: false,
  error: null,
};

export const fetchConsumables = createAsyncThunk(
  'consumables/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await consumableService.getAll();
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Fetch failed');
    }
  },
);

export const fetchConsumableById = createAsyncThunk(
  'consumables/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await consumableService.getById(id);
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Fetch failed');
    }
  },
);

export const createConsumable = createAsyncThunk(
  'consumables/create',
  async (form: ConsumableFormValues, { rejectWithValue }) => {
    try {
      return await consumableService.create(form);
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Create failed');
    }
  },
);

export const updateConsumable = createAsyncThunk(
  'consumables/update',
  async (
    payload: { id: string; form: ConsumableFormValues },
    { rejectWithValue },
  ) => {
    try {
      return await consumableService.update(payload.id, payload.form);
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Update failed');
    }
  },
);

export const deleteConsumable = createAsyncThunk(
  'consumables/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await consumableService.remove(id);
      return id;
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Delete failed');
    }
  },
);

const consumableSlice = createSlice({
  name: 'consumables',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSelected(state) {
      state.selectedConsumable = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConsumables.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchConsumables.fulfilled, (s, action) => {
        s.loading = false;
        s.items = action.payload;
      })
      .addCase(fetchConsumables.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload as string;
      })
      .addCase(fetchConsumableById.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchConsumableById.fulfilled, (s, action) => {
        s.loading = false;
        s.selectedConsumable = action.payload;
      })

      .addCase(createConsumable.pending, (s) => {
        s.loading = true;
      })
      .addCase(createConsumable.fulfilled, (s, action) => {
        s.loading = false;
        s.items.unshift(action.payload);
      })

      .addCase(updateConsumable.pending, (s) => {
        s.loading = true;
      })
      .addCase(updateConsumable.fulfilled, (s, action) => {
        s.loading = false;
        const index = s.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) s.items[index] = action.payload;
      })

      .addCase(deleteConsumable.fulfilled, (s, action) => {
        s.items = s.items.filter((i) => i.id !== action.payload);
      });
  },
});

export const { clearError, clearSelected } = consumableSlice.actions;
export default consumableSlice.reducer;
