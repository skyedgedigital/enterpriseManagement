import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Wages } from "@/types";
import { wagesService } from "@/services/wages.service";

interface WagesState { items: Wages[]; selectedItem: Wages | null; loading: boolean; error: string | null; }
const initialState: WagesState = { items: [], selectedItem: null, loading: false, error: null };

export const fetchWages = createAsyncThunk("wages/fetchAll", async (_, { rejectWithValue }) => {
  try { return await wagesService.getAll(); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch wages"); }
});
export const fetchWagesByFilter = createAsyncThunk(
  "wages/fetchByFilter",
  async (params: { employeeId?: string; year?: number; month?: number }, { rejectWithValue }) => {
    try { return await wagesService.getByFilter(params); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch wages"); }
  }
);
/** FY ending March `fyEndYear` (Apr fyEndYear−1 – Mar fyEndYear). Result only via `.unwrap()`; does not replace `items`. */
export const fetchWagesForFinancialYear = createAsyncThunk(
  "wages/fetchFinancialYear",
  async (fyEndYear: number, { rejectWithValue }) => {
    try {
      return await wagesService.getByFinancialYear(fyEndYear);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch wages for financial year");
    }
  },
);
/** Calendar year `calendarYear` (Jan–Dec). Result only via `.unwrap()`; does not replace `items`. */
export const fetchWagesForCalendarYear = createAsyncThunk(
  "wages/fetchCalendarYear",
  async (calendarYear: number, { rejectWithValue }) => {
    try {
      return await wagesService.getByCalendarYear(calendarYear);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch wages for calendar year",
      );
    }
  },
);
export const addWages = createAsyncThunk("wages/add", async (data: Omit<Wages, "id">, { rejectWithValue }) => {
  try { return await wagesService.create(data); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to add wages"); }
});
export const updateWages = createAsyncThunk("wages/update", async ({ id, data }: { id: string; data: Partial<Wages> }, { rejectWithValue }) => {
  try { await wagesService.update(id, data); return { id, ...data } as Wages; } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to update wages"); }
});
export const deleteWages = createAsyncThunk("wages/delete", async (id: string, { rejectWithValue }) => {
  try { await wagesService.remove(id); return id; } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to delete wages"); }
});

const wagesSlice = createSlice({
  name: "wages",
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
    clearSelectedWages(state) { state.selectedItem = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWages.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchWages.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchWages.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchWagesByFilter.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchWagesByFilter.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchWagesByFilter.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(addWages.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(addWages.fulfilled, (state, action) => { state.loading = false; state.items.push(action.payload); })
      .addCase(addWages.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updateWages.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateWages.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
      })
      .addCase(updateWages.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deleteWages.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteWages.fulfilled, (state, action) => { state.loading = false; state.items = state.items.filter((i) => i.id !== action.payload); })
      .addCase(deleteWages.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export const { clearError: clearWagesError, clearSelectedWages } = wagesSlice.actions;
export default wagesSlice.reducer;
