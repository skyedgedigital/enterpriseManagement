import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Department } from "@/types";
import { departmentService } from "@/services/department.service";

interface DepartmentState {
  items: Department[];
  selectedItem: Department | null;
  loading: boolean;
  error: string | null;
}

const initialState: DepartmentState = {
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
};

export const fetchDepartments = createAsyncThunk(
  "departments/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await departmentService.getAll();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch departments");
    }
  }
);

export const fetchDepartmentById = createAsyncThunk(
  "departments/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      return await departmentService.getById(id);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch department");
    }
  }
);

export const addDepartment = createAsyncThunk(
  "departments/add",
  async (data: Omit<Department, "id">, { rejectWithValue }) => {
    try {
      return await departmentService.create(data);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to add department");
    }
  }
);

export const updateDepartment = createAsyncThunk(
  "departments/update",
  async ({ id, data }: { id: string; data: Partial<Department> }, { rejectWithValue }) => {
    try {
      await departmentService.update(id, data);
      return { id, ...data };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to update department");
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  "departments/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await departmentService.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to delete department");
    }
  }
);

const departmentSlice = createSlice({
  name: "departments",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSelectedDepartment(state) {
      state.selectedItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchDepartmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchDepartmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(addDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload };
        }
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((i) => i.id !== action.payload);
      })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError: clearDepartmentError, clearSelectedDepartment } = departmentSlice.actions;
export default departmentSlice.reducer;
