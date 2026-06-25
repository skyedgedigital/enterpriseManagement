import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "@/types";
import type { RoleStatus, UserRole } from "@/lib/rbac";
import { authService } from "@/services/auth.service";

interface AuthState {
  user: AuthUser | null;
  role: UserRole | null;
  roleStatus: RoleStatus;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  role: null,
  roleStatus: "idle",
  loading: false,
  error: null,
  initialized: false,
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const user = await authService.signIn(email, password);
      return user;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Login failed");
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await authService.signOut();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Logout failed");
    }
  }
);

export const updateUserPassword = createAsyncThunk(
  "auth/updatePassword",
  async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }, { rejectWithValue }) => {
    try {
      await authService.updatePassword(currentPassword, newPassword);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Password update failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.initialized = true;
      state.loading = false;
      if (!action.payload) {
        state.role = null;
        state.roleStatus = "idle";
      }
    },
    setRoleState(
      state,
      action: PayloadAction<{ role: UserRole | null; roleStatus: RoleStatus }>,
    ) {
      state.role = action.payload.role;
      state.roleStatus = action.payload.roleStatus;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.role = null;
        state.roleStatus = "idle";
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Password
      .addCase(updateUserPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateUserPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setUser, setRoleState, clearError } = authSlice.actions;
export default authSlice.reducer;
