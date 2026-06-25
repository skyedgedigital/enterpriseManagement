// @/store/slices/fleet-manager/toolSlice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Tool, ToolStoreManagement } from '@/types';
import {
  toolService,
  toolStoreManagementService,
} from '@/services/fleet-manger/toolStoreManagement.service';

// ============================================================
// Tools
// ============================================================

interface ToolState {
  tools: Tool[];
  selectedTool: Tool | null;
  loading: boolean;
  error: string | null;
}

const initialState: ToolState = {
  tools: [],
  selectedTool: null,
  loading: false,
  error: null,
};

export const fetchTools = createAsyncThunk(
  'tools/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await toolService.getAll();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch tools',
      );
    }
  },
);

export const fetchToolById = createAsyncThunk(
  'tools/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await toolService.getById(id);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch tool',
      );
    }
  },
);

export const addTool = createAsyncThunk(
  'tools/add',
  async (data: Omit<Tool, 'id'>, { rejectWithValue }) => {
    try {
      return await toolService.create(data);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to add tool',
      );
    }
  },
);

export const updateTool = createAsyncThunk(
  'tools/update',
  async (
    { id, data }: { id: string; data: Partial<Tool> },
    { rejectWithValue },
  ) => {
    try {
      await toolService.update(id, data);
      return { id, ...data };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update tool',
      );
    }
  },
);

export const deleteTool = createAsyncThunk(
  'tools/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await toolService.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete tool',
      );
    }
  },
);

const toolSlice = createSlice({
  name: 'tools',
  initialState,
  reducers: {
    clearToolError(state) {
      state.error = null;
    },
    clearSelectedTool(state) {
      state.selectedTool = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchTools.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTools.fulfilled, (state, action) => {
        state.loading = false;
        state.tools = action.payload;
      })
      .addCase(fetchTools.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchById
      .addCase(fetchToolById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchToolById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTool = action.payload;
      })
      .addCase(fetchToolById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // add
      .addCase(addTool.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTool.fulfilled, (state, action) => {
        state.loading = false;
        state.tools.push(action.payload);
      })
      .addCase(addTool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // update
      .addCase(updateTool.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTool.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tools.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tools[index] = { ...state.tools[index], ...action.payload };
        }
        if (state.selectedTool?.id === action.payload.id) {
          state.selectedTool = { ...state.selectedTool, ...action.payload };
        }
      })
      .addCase(updateTool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // delete
      .addCase(deleteTool.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTool.fulfilled, (state, action) => {
        state.loading = false;
        state.tools = state.tools.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteTool.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearToolError, clearSelectedTool } = toolSlice.actions;
export default toolSlice.reducer;

// ============================================================
// Tool Store Management (Allotment)
// ============================================================

interface StoreManagementState {
  allotments: ToolStoreManagement[];
  selectedAllotment: ToolStoreManagement | null;
  loading: boolean;
  error: string | null;
}

const storeManagementInitialState: StoreManagementState = {
  allotments: [],
  selectedAllotment: null,
  loading: false,
  error: null,
};

export const fetchAllotments = createAsyncThunk(
  'storeManagement/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await toolStoreManagementService.getAll();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch allotments',
      );
    }
  },
);

export const fetchAllotmentById = createAsyncThunk(
  'storeManagement/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await toolStoreManagementService.getById(id);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch allotment',
      );
    }
  },
);

export const addAllotment = createAsyncThunk(
  'storeManagement/add',
  async (data: Omit<ToolStoreManagement, 'id'>, { rejectWithValue }) => {
    try {
      return await toolStoreManagementService.create(data);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to create allotment',
      );
    }
  },
);

export const updateAllotment = createAsyncThunk(
  'storeManagement/update',
  async (
    { id, data }: { id: string; data: Partial<ToolStoreManagement> },
    { rejectWithValue },
  ) => {
    try {
      await toolStoreManagementService.update(id, data);
      return { id, ...data };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update allotment',
      );
    }
  },
);

export const deleteAllotment = createAsyncThunk(
  'storeManagement/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await toolStoreManagementService.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete allotment',
      );
    }
  },
);

const storeManagementSlice = createSlice({
  name: 'storeManagement',
  initialState: storeManagementInitialState,
  reducers: {
    clearStoreManagementError(state) {
      state.error = null;
    },
    clearSelectedAllotment(state) {
      state.selectedAllotment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchAllotments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllotments.fulfilled, (state, action) => {
        state.loading = false;
        state.allotments = action.payload;
      })
      .addCase(fetchAllotments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchById
      .addCase(fetchAllotmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllotmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAllotment = action.payload;
      })
      .addCase(fetchAllotmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // add
      .addCase(addAllotment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAllotment.fulfilled, (state, action) => {
        state.loading = false;
        state.allotments.unshift(action.payload);
      })
      .addCase(addAllotment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // update
      .addCase(updateAllotment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAllotment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.allotments.findIndex(
          (a) => a.id === action.payload.id,
        );
        if (index !== -1) {
          state.allotments[index] = {
            ...state.allotments[index],
            ...action.payload,
          };
        }
      })
      .addCase(updateAllotment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // delete
      .addCase(deleteAllotment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAllotment.fulfilled, (state, action) => {
        state.loading = false;
        state.allotments = state.allotments.filter(
          (a) => a.id !== action.payload,
        );
      })
      .addCase(deleteAllotment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearStoreManagementError, clearSelectedAllotment } =
  storeManagementSlice.actions;
export const toolStoreManagementReducer = storeManagementSlice.reducer;
