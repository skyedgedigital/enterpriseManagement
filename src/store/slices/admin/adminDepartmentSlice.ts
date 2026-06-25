import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { AdminDepartment } from '@/types/admin';
import { adminDepartmentService } from '@/services/admin/adminDepartment.service';

interface AdminDepartmentState {
  items: AdminDepartment[];
  selectedItem: AdminDepartment | null;
  loading: boolean;
  error: string | null;
}

const initialState: AdminDepartmentState = {
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
};

export const fetchAdminDepartments = createAsyncThunk(
  'adminDepartments/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await adminDepartmentService.getAll();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch departments',
      );
    }
  },
);

export const fetchAdminDepartmentById = createAsyncThunk(
  'adminDepartments/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await adminDepartmentService.getById(id);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch department',
      );
    }
  },
);

export const addAdminDepartment = createAsyncThunk(
  'adminDepartments/add',
  async (data: Omit<AdminDepartment, 'id'>, { rejectWithValue }) => {
    try {
      return await adminDepartmentService.create(data);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to add department',
      );
    }
  },
);

export const updateAdminDepartment = createAsyncThunk(
  'adminDepartments/update',
  async (
    { id, data }: { id: string; data: Partial<AdminDepartment> },
    { rejectWithValue },
  ) => {
    try {
      await adminDepartmentService.update(id, data);
      return { id, ...data };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update department',
      );
    }
  },
);

export const deleteAdminDepartment = createAsyncThunk(
  'adminDepartments/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await adminDepartmentService.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete department',
      );
    }
  },
);

const adminDepartmentSlice = createSlice({
  name: 'adminDepartments',
  initialState,
  reducers: {
    clearAdminDepartmentError(state) {
      state.error = null;
    },
    clearSelectedAdminDepartment(state) {
      state.selectedItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAdminDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAdminDepartmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminDepartmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchAdminDepartmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addAdminDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAdminDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(addAdminDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateAdminDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAdminDepartment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      .addCase(updateAdminDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteAdminDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAdminDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((i) => i.id !== action.payload);
      })
      .addCase(deleteAdminDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAdminDepartmentError, clearSelectedAdminDepartment } =
  adminDepartmentSlice.actions;
export default adminDepartmentSlice.reducer;
