// @/store/slices/fleet-manager/fuelManagementSlice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { FuelEntry, FuelPrice } from '@/types';
import { fuelEntryService, fuelPriceService } from '@/services/fleet-manger/fuelManagement.service';


// ============================================================
// Fuel Entries
// ============================================================

interface FuelEntryState {
  entries: FuelEntry[];
  loading: boolean;
  error: string | null;
}

const entryInitialState: FuelEntryState = {
  entries: [],
  loading: false,
  error: null,
};

// Fetch ALL entries (default view / after clearing filter)
export const fetchAllFuelEntries = createAsyncThunk(
  'fuelEntries/fetchAll',
  async ({ vehicleId }: { vehicleId?: string } = {}, { rejectWithValue }) => {
    try {
      return await fuelEntryService.getAll(vehicleId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch fuel entries',
      );
    }
  },
);

// Fetch by month+year (filtered view)
export const fetchFuelEntries = createAsyncThunk(
  'fuelEntries/fetchByMonthYear',
  async (
    {
      year,
      month,
      vehicleId,
    }: { year: number; month: number; vehicleId?: string },
    { rejectWithValue },
  ) => {
    try {
      return await fuelEntryService.getByMonthYear(year, month, vehicleId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch fuel entries',
      );
    }
  },
);

export const addFuelEntry = createAsyncThunk(
  'fuelEntries/add',
  async (data: Omit<FuelEntry, 'id'>, { rejectWithValue }) => {
    try {
      return await fuelEntryService.create(data);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to add fuel entry',
      );
    }
  },
);

export const deleteFuelEntry = createAsyncThunk(
  'fuelEntries/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await fuelEntryService.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete fuel entry',
      );
    }
  },
);

const fuelEntrySlice = createSlice({
  name: 'fuelEntries',
  initialState: entryInitialState,
  reducers: {
    clearFuelEntries(state) {
      state.entries = [];
    },
  },
  extraReducers: (builder) => {
    // fetchAll
    builder
      .addCase(fetchAllFuelEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllFuelEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
      })
      .addCase(fetchAllFuelEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchByMonthYear
      .addCase(fetchFuelEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFuelEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
      })
      .addCase(fetchFuelEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // add
      .addCase(addFuelEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addFuelEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.entries.unshift(action.payload);
      })
      .addCase(addFuelEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // delete
      .addCase(deleteFuelEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFuelEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = state.entries.filter((e) => e.id !== action.payload);
      })
      .addCase(deleteFuelEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearFuelEntries } = fuelEntrySlice.actions;
export const fuelEntryReducer = fuelEntrySlice.reducer;

// ============================================================
// Fuel Prices
// ============================================================

interface FuelPriceState {
  prices: FuelPrice[];
  loading: boolean;
  error: string | null;
}

const priceInitialState: FuelPriceState = {
  prices: [],
  loading: false,
  error: null,
};

export const fetchFuelPrices = createAsyncThunk(
  'fuelPrices/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fuelPriceService.getAll();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch fuel prices',
      );
    }
  },
);

export const upsertFuelPrice = createAsyncThunk(
  'fuelPrices/upsert',
  async (
    { fuelType, price }: { fuelType: string; price: number },
    { rejectWithValue },
  ) => {
    try {
      await fuelPriceService.upsert(fuelType, price);
      return { id: fuelType, fuelType: fuelType as 'petrol' | 'diesel', price };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to save fuel price',
      );
    }
  },
);

const fuelPriceSlice = createSlice({
  name: 'fuelPrices',
  initialState: priceInitialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFuelPrices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFuelPrices.fulfilled, (state, action) => {
        state.loading = false;
        state.prices = action.payload;
      })
      .addCase(fetchFuelPrices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(upsertFuelPrice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(upsertFuelPrice.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.prices.findIndex(
          (p) => p.fuelType === action.payload.fuelType,
        );
        if (idx !== -1) {
          state.prices[idx] = { ...state.prices[idx], ...action.payload };
        } else {
          state.prices.push(action.payload);
        }
      })
      .addCase(upsertFuelPrice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const fuelPriceReducer = fuelPriceSlice.reducer;
