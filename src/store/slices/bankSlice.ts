import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Bank } from "@/types";
import { bankService } from "@/services/bank.service";

interface BankState {
  items: Bank[];
  selectedItem: Bank | null;
  loading: boolean;
  error: string | null;
}

const initialState: BankState = { items: [], selectedItem: null, loading: false, error: null };

export const fetchBanks = createAsyncThunk("banks/fetchAll", async (_, { rejectWithValue }) => {
  try { return await bankService.getAll(); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch banks"); }
});

export const fetchBankById = createAsyncThunk("banks/fetchById", async (id: string, { rejectWithValue }) => {
  try { return await bankService.getById(id); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch bank"); }
});

export const addBank = createAsyncThunk("banks/add", async (data: Omit<Bank, "id">, { rejectWithValue }) => {
  try { return await bankService.create(data); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to add bank"); }
});

export const updateBank = createAsyncThunk("banks/update", async ({ id, data }: { id: string; data: Partial<Bank> }, { rejectWithValue }) => {
  try { await bankService.update(id, data); return { id, ...data }; } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to update bank"); }
});

export const deleteBank = createAsyncThunk("banks/delete", async (id: string, { rejectWithValue }) => {
  try { await bankService.remove(id); return id; } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to delete bank"); }
});

const bankSlice = createSlice({
  name: "banks",
  initialState,
  reducers: { 
    clearError(state) { state.error = null; },
    clearSelectedBank(state) { state.selectedItem = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBanks.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchBanks.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchBankById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBankById.fulfilled, (state, action) => { state.loading = false; state.selectedItem = action.payload; })
      .addCase(fetchBankById.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(addBank.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(addBank.fulfilled, (state, action) => { state.loading = false; state.items.push(action.payload); })
      .addCase(addBank.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updateBank.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateBank.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
      })
      .addCase(updateBank.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deleteBank.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteBank.fulfilled, (state, action) => { state.loading = false; state.items = state.items.filter((i) => i.id !== action.payload); })
      .addCase(deleteBank.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export const { clearError: clearBankError, clearSelectedBank } = bankSlice.actions;
export default bankSlice.reducer;
