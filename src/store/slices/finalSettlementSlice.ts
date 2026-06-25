import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { FinalSettlement } from "@/types";
import { finalSettlementService } from "@/services/finalSettlement.service";

interface FinalSettlementState { items: FinalSettlement[]; selectedItem: FinalSettlement | null; loading: boolean; error: string | null; }
const initialState: FinalSettlementState = { items: [], selectedItem: null, loading: false, error: null };

export const fetchFinalSettlements = createAsyncThunk("finalSettlements/fetchAll", async (_, { rejectWithValue }) => {
  try { return await finalSettlementService.getAll(); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch settlements"); }
});
export const addFinalSettlement = createAsyncThunk("finalSettlements/add", async (data: Omit<FinalSettlement, "id">, { rejectWithValue }) => {
  try { return await finalSettlementService.create(data); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to add settlement"); }
});
export const updateFinalSettlement = createAsyncThunk("finalSettlements/update", async ({ id, data }: { id: string; data: Partial<FinalSettlement> }, { rejectWithValue }) => {
  try { await finalSettlementService.update(id, data); return { id, ...data } as FinalSettlement; } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to update settlement"); }
});
export const deleteFinalSettlement = createAsyncThunk("finalSettlements/delete", async (id: string, { rejectWithValue }) => {
  try { await finalSettlementService.remove(id); return id; } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to delete settlement"); }
});

const finalSettlementSlice = createSlice({
  name: "finalSettlements",
  initialState,
  reducers: { clearError(state) { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFinalSettlements.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFinalSettlements.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchFinalSettlements.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(addFinalSettlement.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(addFinalSettlement.fulfilled, (state, action) => { state.loading = false; state.items.push(action.payload); })
      .addCase(addFinalSettlement.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updateFinalSettlement.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateFinalSettlement.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
      })
      .addCase(updateFinalSettlement.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deleteFinalSettlement.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteFinalSettlement.fulfilled, (state, action) => { state.loading = false; state.items = state.items.filter((i) => i.id !== action.payload); })
      .addCase(deleteFinalSettlement.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export const { clearError: clearFinalSettlementError } = finalSettlementSlice.actions;
export default finalSettlementSlice.reducer;
