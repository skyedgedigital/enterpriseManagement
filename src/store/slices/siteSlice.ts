import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Site } from "@/types";
import { siteService } from "@/services/site.service";

interface SiteState { items: Site[]; selectedItem: Site | null; loading: boolean; error: string | null; }
const initialState: SiteState = { items: [], selectedItem: null, loading: false, error: null };

export const fetchSites = createAsyncThunk("sites/fetchAll", async (_, { rejectWithValue }) => {
  try { return await siteService.getAll(); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch sites"); }
});
export const fetchSiteById = createAsyncThunk("sites/fetchById", async (id: string, { rejectWithValue }) => {
  try { return await siteService.getById(id); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch site"); }
});
export const addSite = createAsyncThunk("sites/add", async (data: Omit<Site, "id">, { rejectWithValue }) => {
  try { return await siteService.create(data); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to add site"); }
});
export const updateSite = createAsyncThunk("sites/update", async ({ id, data }: { id: string; data: Partial<Site> }, { rejectWithValue }) => {
  try { await siteService.update(id, data); return { id, ...data }; } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to update site"); }
});
export const deleteSite = createAsyncThunk("sites/delete", async (id: string, { rejectWithValue }) => {
  try { await siteService.remove(id); return id; } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to delete site"); }
});

const siteSlice = createSlice({
  name: "sites",
  initialState,
  reducers: { 
    clearError(state) { state.error = null; },
    clearSelectedSite(state) { state.selectedItem = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSites.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSites.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchSites.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchSiteById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSiteById.fulfilled, (state, action) => { state.loading = false; state.selectedItem = action.payload; })
      .addCase(fetchSiteById.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(addSite.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(addSite.fulfilled, (state, action) => { state.loading = false; state.items.push(action.payload); })
      .addCase(addSite.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updateSite.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateSite.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
      })
      .addCase(updateSite.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deleteSite.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteSite.fulfilled, (state, action) => { state.loading = false; state.items = state.items.filter((i) => i.id !== action.payload); })
      .addCase(deleteSite.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export const { clearError: clearSiteError, clearSelectedSite } = siteSlice.actions;
export default siteSlice.reducer;
