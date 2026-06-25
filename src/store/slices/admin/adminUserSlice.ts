import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type {
  CreateAppUserFormValues,
  EditAppUserFormValues,
} from '@/lib/admin/validators';
import {
  adminUserService,
  type UserRoleRecord,
} from '@/services/admin/user.service';

interface AdminUserState {
  items: UserRoleRecord[];
  loading: boolean;
  error: string | null;
}

const initialState: AdminUserState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchUserRoles = createAsyncThunk(
  'adminUsers/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await adminUserService.getAll();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch users',
      );
    }
  },
);

export const createAppUser = createAsyncThunk(
  'adminUsers/create',
  async (data: CreateAppUserFormValues, { rejectWithValue }) => {
    try {
      return await adminUserService.create(data);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to create user',
      );
    }
  },
);

export const updateAdminUser = createAsyncThunk(
  'adminUsers/updateProfile',
  async (
    payload: { uid: string; data: EditAppUserFormValues },
    { rejectWithValue },
  ) => {
    try {
      return await adminUserService.updateProfile(payload.uid, payload.data);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update user',
      );
    }
  },
);

const adminUserSlice = createSlice({
  name: 'adminUsers',
  initialState,
  reducers: {
    clearAdminUserError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchUserRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createAppUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAppUser.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createAppUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateAdminUser.fulfilled, (state, action) => {
        const idx = state.items.findIndex((u) => u.id === action.payload.id);
        if (idx >= 0) {
          state.items[idx] = action.payload;
        } else {
          state.items.push(action.payload);
        }
      })
      .addCase(updateAdminUser.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearAdminUserError } = adminUserSlice.actions;
export default adminUserSlice.reducer;
