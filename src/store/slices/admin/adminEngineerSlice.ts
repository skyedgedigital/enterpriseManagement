import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Engineer } from '@/types/index';
import { engineerService } from '@/services/admin/engineer.service';

interface EngineerState {
  engineers: Engineer[];
  selectedEngineer: Engineer | null;
  loading: boolean;
  error: string | null;
}

const initialState: EngineerState = {
  engineers: [],
  selectedEngineer: null,
  loading: false,
  error: null,
};

export const fetchEngineers = createAsyncThunk(
  'engineers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await engineerService.getAll();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch engineer',
      );
    }
  },
);

export const fetchEngineerById = createAsyncThunk(
  'engineers/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await engineerService.getById(id);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch engineer',
      );
    }
  },
);

export const fetchEngineersByDepartment = createAsyncThunk(
  'engineers/fetchEngineersByDepartment',
  async (departmentId: string, { rejectWithValue }) => {
    try {
      return await engineerService.getEngineersByDepartment(departmentId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch engineer',
      );
    }
  },
);

export const addEngineer = createAsyncThunk(
  'engineers/add',
  async (data: Omit<Engineer, 'id'>, { rejectWithValue }) => {
    try {
      return await engineerService.create(data);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to add engineer',
      );
    }
  },
);

export const updateEngineer = createAsyncThunk(
  'engineers/update',
  async (
    { id, data }: { id: string; data: Partial<Engineer> },
    { rejectWithValue },
  ) => {
    try {
      await engineerService.update(id, data);
      return { id, ...data };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update engineer',
      );
    }
  },
);

export const deleteEngineer = createAsyncThunk(
  'engineers/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await engineerService.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete engineer',
      );
    }
  },
);

const adminEngineerSlice = createSlice({
  name: 'engineers',
  initialState,
  reducers: {
    clearEngineerError(state) {
      state.error = null;
    },
    clearSelectedEngineer(state) {
      state.selectedEngineer = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEngineers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEngineers.fulfilled, (state, action) => {
        state.loading = false;
        state.engineers = action.payload;
      })
      .addCase(fetchEngineers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchEngineerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEngineerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedEngineer = action.payload;
      })
      .addCase(fetchEngineerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addEngineer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addEngineer.fulfilled, (state, action) => {
        state.loading = false;
        state.engineers.push(action.payload);
      })
      .addCase(addEngineer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateEngineer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEngineer.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.engineers.findIndex(
          (i) => i.id === action.payload.id,
        );
        if (index !== -1) {
          state.engineers[index] = {
            ...state.engineers[index],
            ...action.payload,
          };
        }
      })
      .addCase(updateEngineer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteEngineer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEngineer.fulfilled, (state, action) => {
        state.loading = false;
        state.engineers = state.engineers.filter(
          (i) => i.id !== action.payload,
        );
      })
      .addCase(deleteEngineer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearEngineerError, clearSelectedEngineer } =
  adminEngineerSlice.actions;
export default adminEngineerSlice.reducer;
