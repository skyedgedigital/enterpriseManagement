import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Designation } from "@/types";
import { designationService } from "@/services/designation.service";

interface DesignationState {
  items: Designation[];
  selectedItem: Designation | null;
  loading: boolean;
  error: string | null;
}

const initialState: DesignationState = {
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
};

export const fetchDesignations = createAsyncThunk(
  "designations/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await designationService.getAll();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch designations");
    }
  }
);

export const fetchDesignationById = createAsyncThunk(
  "designations/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      return await designationService.getById(id);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch designation");
    }
  }
);

export const addDesignation = createAsyncThunk(
  "designations/add",
  async (data: Omit<Designation, "id">, { rejectWithValue }) => {
    try {
      return await designationService.create(data);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to add designation");
    }
  }
);

export const updateDesignation = createAsyncThunk(
  "designations/update",
  async ({ id, data }: { id: string; data: Partial<Designation> }, { rejectWithValue }) => {
    try {
      await designationService.update(id, data);
      return { id, ...data };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to update designation");
    }
  }
);

export const deleteDesignation = createAsyncThunk(
  "designations/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await designationService.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to delete designation");
    }
  }
);

const designationSlice = createSlice({
  name: "designations",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSelectedDesignation(state) {
      state.selectedItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDesignations.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDesignations.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchDesignations.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchDesignationById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDesignationById.fulfilled, (state, action) => { state.loading = false; state.selectedItem = action.payload; })
      .addCase(fetchDesignationById.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(addDesignation.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(addDesignation.fulfilled, (state, action) => { state.loading = false; state.items.push(action.payload); })
      .addCase(addDesignation.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updateDesignation.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateDesignation.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
      })
      .addCase(updateDesignation.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deleteDesignation.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteDesignation.fulfilled, (state, action) => { state.loading = false; state.items = state.items.filter((i) => i.id !== action.payload); })
      .addCase(deleteDesignation.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export const { clearError: clearDesignationError, clearSelectedDesignation } = designationSlice.actions;
export default designationSlice.reducer;
