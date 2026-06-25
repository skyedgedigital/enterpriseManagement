import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { FleetWorkOrder, FleetWorkOrderItem } from '@/types';
import { fleetWorkOrderService } from '@/services/fleet-manger/workOrder.service';
import type {
  FleetWorkOrderEditFormValues,
  FleetWorkOrderFormValues,
} from '@/lib/fleet-manager/validators';

interface FleetWorkOrderState {
  items: FleetWorkOrder[];
  selectedWorkOrder: FleetWorkOrder | null;
  selectedWorkOrderItems: FleetWorkOrderItem[] | null;
  loading: boolean;
  error: string | null;
}

const initialState: FleetWorkOrderState = {
  items: [],
  selectedWorkOrder: null,
  selectedWorkOrderItems: null,
  loading: false,
  error: null,
};

export const fetchFleetWorkOrders = createAsyncThunk(
  'fleetWorkOrders/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fleetWorkOrderService.getAll();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch work orders',
      );
    }
  },
);

export const fetchFleetWorkOrderById = createAsyncThunk(
  'fleetWorkOrders/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await fleetWorkOrderService.getById(id);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch work order',
      );
    }
  },
);

export const fetchFleetWorkOrderItemsByWorkOrderId = createAsyncThunk(
  'fleetWorkOrders/fetchItemsByWorkOrderId',
  async (workOrderId: string, { rejectWithValue }) => {
    try {
      return await fleetWorkOrderService.getItemsByWorkOrderId(workOrderId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to fetch work order items',
      );
    }
  },
);

export const createFleetWorkOrder = createAsyncThunk(
  'fleetWorkOrders/create',
  async (form: FleetWorkOrderFormValues, { rejectWithValue }) => {
    try {
      return await fleetWorkOrderService.createFleetWorkOrder(form);
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Create failed');
    }
  },
);

export const updateFleetWorkOrderEdits = createAsyncThunk(
  'fleetWorkOrders/update',
  async (
    payload: { id: string; form: FleetWorkOrderEditFormValues },
    { rejectWithValue },
  ) => {
    try {
      return await fleetWorkOrderService.updateFleetWorkOrderFields(
        payload.id,
        payload.form,
      );
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Update failed');
    }
  },
);
export const deleteFleetWorkOrder = createAsyncThunk(
  'fleetWorkOrders/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await fleetWorkOrderService.remove(id);
      return id;
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Delete failed');
    }
  },
);
const fleetWorkOrderSlice = createSlice({
  name: 'fleetWorkOrders',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    clearSelected(state) {
      state.selectedWorkOrder = null;
      state.selectedWorkOrderItems = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFleetWorkOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFleetWorkOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchFleetWorkOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchFleetWorkOrderById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFleetWorkOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedWorkOrder = action.payload;
      })
      .addCase(fetchFleetWorkOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchFleetWorkOrderItemsByWorkOrderId.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchFleetWorkOrderItemsByWorkOrderId.fulfilled,
        (state, action) => {
          state.loading = false;
          state.selectedWorkOrderItems = action.payload;
        },
      )
      .addCase(
        fetchFleetWorkOrderItemsByWorkOrderId.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        },
      )
      .addCase(createFleetWorkOrder.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(createFleetWorkOrder.fulfilled, (s, action) => {
        s.loading = false;
        s.items.push(action.payload.workOrder);
      })
      .addCase(createFleetWorkOrder.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload as string;
      })
      .addCase(updateFleetWorkOrderEdits.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(updateFleetWorkOrderEdits.fulfilled, (s, action) => {
        s.loading = false;
        const wo = action.payload;
        const idx = s.items.findIndex((i) => i.id === wo.id);
        if (idx !== -1) s.items[idx] = { ...s.items[idx], ...wo };
        if (s.selectedWorkOrder?.id === wo.id) s.selectedWorkOrder = wo;
      })
      .addCase(updateFleetWorkOrderEdits.rejected, (s, action) => {
        s.loading = false;
        s.error = action.payload as string;
      })
      .addCase(deleteFleetWorkOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFleetWorkOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((i) => i.id !== action.payload);
      })
      .addCase(deleteFleetWorkOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError: clearFleetWorkOrderError,
  clearSelected: clearFleetWorkOrderSelected,
} = fleetWorkOrderSlice.actions;
export default fleetWorkOrderSlice.reducer;
