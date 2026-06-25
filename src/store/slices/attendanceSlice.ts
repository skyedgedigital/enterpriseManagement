import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Attendance } from "@/types";
import { attendanceService } from "@/services/attendance.service";

interface AttendanceState { items: Attendance[]; selectedItem: Attendance | null; loading: boolean; error: string | null; }
const initialState: AttendanceState = { items: [], selectedItem: null, loading: false, error: null };

export const fetchAttendances = createAsyncThunk("attendances/fetchAll", async (_, { rejectWithValue }) => {
  try { return await attendanceService.getAll(); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch attendance records"); }
});
export const fetchAttendanceByFilter = createAsyncThunk(
  "attendances/fetchByFilter",
  async (params: { employeeId?: string; year?: number; month?: number }, { rejectWithValue }) => {
    try { return await attendanceService.getByFilter(params); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch attendance"); }
  }
);
/** FY ending March `fyEndYear`. Result only via `.unwrap()`; does not replace `items`. */
export const fetchAttendanceForFinancialYear = createAsyncThunk(
  "attendances/fetchFinancialYear",
  async (fyEndYear: number, { rejectWithValue }) => {
    try {
      return await attendanceService.getByFinancialYear(fyEndYear);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch attendance for financial year");
    }
  },
);
/** Calendar year `calendarYear` (Jan–Dec). Result only via `.unwrap()`; does not replace `items`. */
export const fetchAttendanceForCalendarYear = createAsyncThunk(
  "attendances/fetchCalendarYear",
  async (calendarYear: number, { rejectWithValue }) => {
    try {
      return await attendanceService.getByCalendarYear(calendarYear);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to fetch attendance for calendar year",
      );
    }
  },
);
export const addAttendance = createAsyncThunk("attendances/add", async (data: Omit<Attendance, "id">, { rejectWithValue }) => {
  try { return await attendanceService.create(data); } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to add attendance"); }
});
export const updateAttendance = createAsyncThunk("attendances/update", async ({ id, data }: { id: string; data: Partial<Attendance> }, { rejectWithValue }) => {
  try { await attendanceService.update(id, data); return { id, ...data } as Attendance; } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to update attendance"); }
});
export const deleteAttendance = createAsyncThunk("attendances/delete", async (id: string, { rejectWithValue }) => {
  try { await attendanceService.remove(id); return id; } catch (error) { return rejectWithValue(error instanceof Error ? error.message : "Failed to delete attendance"); }
});

const attendanceSlice = createSlice({
  name: "attendances",
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
    clearSelectedAttendance(state) { state.selectedItem = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendances.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAttendances.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchAttendances.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(fetchAttendanceByFilter.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAttendanceByFilter.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchAttendanceByFilter.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(addAttendance.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(addAttendance.fulfilled, (state, action) => { state.loading = false; state.items.push(action.payload); })
      .addCase(addAttendance.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(updateAttendance.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateAttendance.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
      })
      .addCase(updateAttendance.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deleteAttendance.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteAttendance.fulfilled, (state, action) => { state.loading = false; state.items = state.items.filter((i) => i.id !== action.payload); })
      .addCase(deleteAttendance.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export const { clearError: clearAttendanceError, clearSelectedAttendance } = attendanceSlice.actions;
export default attendanceSlice.reducer;
