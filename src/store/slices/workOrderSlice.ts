import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { WorkOrder } from '@/types';
import { workOrderService } from '@/services/workOrder.service';

interface WorkOrderState {
  items: WorkOrder[];
  selectedItem: WorkOrder | null;
  loading: boolean;
  error: string | null;
}
const initialState: WorkOrderState = {
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
};

export const fetchWorkOrders = createAsyncThunk(
  'workOrders/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await workOrderService.getAll();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch work orders',
      );
    }
  },
);
export const fetchWorkOrderById = createAsyncThunk(
  'workOrders/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await workOrderService.getById(id);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch work order',
      );
    }
  },
);
export const addWorkOrder = createAsyncThunk(
  'workOrders/add',
  async (data: Omit<WorkOrder, 'id'>, { rejectWithValue }) => {
    try {
      return await workOrderService.create(data);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to add work order',
      );
    }
  },
);
export const updateWorkOrder = createAsyncThunk(
  'workOrders/update',
  async (
    { id, data }: { id: string; data: Partial<WorkOrder> },
    { rejectWithValue },
  ) => {
    try {
      await workOrderService.update(id, data);
      return { id, ...data } as WorkOrder;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update work order',
      );
    }
  },
);
export const deleteWorkOrder = createAsyncThunk(
  'workOrders/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await workOrderService.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete work order',
      );
    }
  },
);

const workOrderSlice = createSlice({
  name: 'workOrders',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSelectedWorkOrder(state) {
      state.selectedItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWorkOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchWorkOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchWorkOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addWorkOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addWorkOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(addWorkOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateWorkOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWorkOrder.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1)
          state.items[idx] = { ...state.items[idx], ...action.payload };
      })
      .addCase(updateWorkOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteWorkOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWorkOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((i) => i.id !== action.payload);
      })
      .addCase(deleteWorkOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError: clearWorkOrderError, clearSelectedWorkOrder } =
  workOrderSlice.actions;
export default workOrderSlice.reducer;
