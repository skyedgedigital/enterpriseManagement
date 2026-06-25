import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { EsiLocation } from "@/types";
import { esiLocationService } from "@/services/esiLocation.service";

interface EsiLocationState { items: EsiLocation[]; selectedItem: EsiLocation | null; loading: boolean; error: string | null; }
const initialState: EsiLocationState = { items: [], selectedItem: null, loading: false, error: null };

export const fetchEsiLocations = createAsyncThunk("esiLocations/fetchAll", async (_, { rejectWithValue }) => {
  try { return await esiLocationService.getAll(); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch ESI locations"); }
});
export const fetchEsiLocationById = createAsyncThunk("esiLocations/fetchById", async (id: string, { rejectWithValue }) => {
  try { return await esiLocationService.getById(id); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch ESI location"); }
});
export const addEsiLocation = createAsyncThunk("esiLocations/add", async (data: Omit<EsiLocation, "id">, { rejectWithValue }) => {
  try { return await esiLocationService.create(data); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to add ESI location"); }
});
export const updateEsiLocation = createAsyncThunk("esiLocations/update", async ({ id, data }: { id: string; data: Partial<EsiLocation> }, { rejectWithValue }) => {
  try { await esiLocationService.update(id, data); return { id, ...data }; } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to update ESI location"); }
});
export const deleteEsiLocation = createAsyncThunk("esiLocations/delete", async (id: string, { rejectWithValue }) => {
  try { await esiLocationService.remove(id); return id; } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to delete ESI location"); }
});

const esiLocationSlice = createSlice({
  name: "esiLocations",
  initialState,
  reducers: { 
    clearError(state) { state.error = null; },
    clearSelectedEsiLocation(state) { state.selectedItem = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEsiLocations.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEsiLocations.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchEsiLocations.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchEsiLocationById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEsiLocationById.fulfilled, (state, action) => { state.loading = false; state.selectedItem = action.payload; })
      .addCase(fetchEsiLocationById.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(addEsiLocation.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(addEsiLocation.fulfilled, (state, action) => { state.loading = false; state.items.push(action.payload); })
      .addCase(addEsiLocation.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updateEsiLocation.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateEsiLocation.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
      })
      .addCase(updateEsiLocation.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deleteEsiLocation.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteEsiLocation.fulfilled, (state, action) => { state.loading = false; state.items = state.items.filter((i) => i.id !== action.payload); })
      .addCase(deleteEsiLocation.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export const { clearError: clearEsiLocationError, clearSelectedEsiLocation } = esiLocationSlice.actions;
export default esiLocationSlice.reducer;
