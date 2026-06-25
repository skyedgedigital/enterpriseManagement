import { enterpriseDetailsService } from '@/services/admin/enterpriseDetails.service';
import type { EnterpriseDetails } from '@/types';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface EnterpriseDetailsState {
  enterPriseDetails: EnterpriseDetails | null;
  loading: boolean;
  error: string | null;
}

const initialState: EnterpriseDetailsState = {
  enterPriseDetails: null,
  loading: false,
  error: null,
};

const fetchEnterpriseDetails = createAsyncThunk(
  'enterpriseDetails/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await enterpriseDetailsService.getDetails();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to fetch enterprise details',
      );
    }
  },
);

const saveEnterpriseDetails = createAsyncThunk(
  'enterpriseDetails/save',
  async (data: Partial<EnterpriseDetails>, { rejectWithValue }) => {
    try {
      return await enterpriseDetailsService.saveEnterpriseDetails(data);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to save enterprise details',
      );
    }
  },
);
const enterpriseDetailsSlice = createSlice({
  name: 'enterpriseDetails',
  initialState,
  reducers: {
    clearEnterpriseDetailsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnterpriseDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnterpriseDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.enterPriseDetails = action.payload;
      })
      .addCase(fetchEnterpriseDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(saveEnterpriseDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveEnterpriseDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.enterPriseDetails = action.payload;
      })
      .addCase(saveEnterpriseDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearEnterpriseDetailsError } = enterpriseDetailsSlice.actions;
export default enterpriseDetailsSlice.reducer;
