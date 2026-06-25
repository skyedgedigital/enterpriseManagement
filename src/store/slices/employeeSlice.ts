import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Employee } from "@/types";
import { employeeService } from "@/services/employee.service";

interface EmployeeState {
  items: Employee[];
  selectedEmployee: Employee | null;
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeState = {
  items: [],
  selectedEmployee: null,
  loading: false,
  error: null,
};

export const fetchEmployees = createAsyncThunk("employees/fetchAll", async (_, { rejectWithValue }) => {
  try { return await employeeService.getAll(); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch employees"); }
});

export const fetchEmployeeById = createAsyncThunk("employees/fetchById", async (id: string, { rejectWithValue }) => {
  try { return await employeeService.getById(id); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch employee"); }
});

export const addEmployee = createAsyncThunk("employees/add", async (data: Omit<Employee, "id">, { rejectWithValue }) => {
  try { return await employeeService.create(data); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to add employee"); }
});

export const updateEmployee = createAsyncThunk("employees/update", async ({ id, data }: { id: string; data: Partial<Employee> }, { rejectWithValue }) => {
  try { await employeeService.update(id, data); return { id, ...data } as Employee; } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to update employee"); }
});

export const deleteEmployee = createAsyncThunk("employees/delete", async (id: string, { rejectWithValue }) => {
  try { await employeeService.remove(id); return id; } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to delete employee"); }
});

const employeeSlice = createSlice({
  name: "employees",
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
    clearSelectedEmployee(state) { state.selectedEmployee = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEmployees.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchEmployees.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchEmployeeById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEmployeeById.fulfilled, (state, action) => { state.loading = false; state.selectedEmployee = action.payload; })
      .addCase(fetchEmployeeById.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(addEmployee.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(addEmployee.fulfilled, (state, action) => { state.loading = false; state.items.push(action.payload); })
      .addCase(addEmployee.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updateEmployee.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
        if (state.selectedEmployee?.id === action.payload.id) {
          state.selectedEmployee = { ...state.selectedEmployee, ...action.payload };
        }
      })
      .addCase(updateEmployee.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deleteEmployee.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteEmployee.fulfilled, (state, action) => { state.loading = false; state.items = state.items.filter((i) => i.id !== action.payload); })
      .addCase(deleteEmployee.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export const { clearError: clearEmployeeError, clearSelectedEmployee } = employeeSlice.actions;
export default employeeSlice.reducer;
