import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { FleetInvoice } from '@/types';
import {
  invoiceService,
  type CreateInvoicePayload,
} from '@/services/fleet-manger/invoice.service';

interface InvoiceState {
  invoices: FleetInvoice[];
  loading: boolean;
  error: string | null;
  selectedInvoice: FleetInvoice | null;
}

const initialState: InvoiceState = {
  invoices: [],
  loading: false,
  error: null,
  selectedInvoice: null,
};

export const createInvoice = createAsyncThunk(
  'invoices/create',
  async (payload: CreateInvoicePayload, { rejectWithValue }) => {
    try {
      return await invoiceService.create(payload);
    } catch (e) {
      return rejectWithValue(
        e instanceof Error ? e.message : 'Failed to create invoice',
      );
    }
  },
);

export const fetchInvoices = createAsyncThunk(
  'invoices/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await invoiceService.getAll();
    } catch (e) {
      return rejectWithValue(
        e instanceof Error ? e.message : 'Failed to fetch invoices',
      );
    }
  },
);

export const fetchLatestInvoiceSerial = createAsyncThunk(
  'invoices/fetchLatestSerial',
  async (_, { rejectWithValue }) => {
    try {
      return await invoiceService.getLatestSerial();
    } catch (e) {
      return rejectWithValue(e instanceof Error ? e.message : 'Failed');
    }
  },
);
export const updateInvoiceMeta = createAsyncThunk(
  'invoices/updateMeta',
  async (
    payload: {
      invoiceId: string;
      sesNo?: string;
      doNo?: string;
      taxNumber?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      await invoiceService.updateInvoiceMeta(payload.invoiceId, {
        sesNo: payload.sesNo,
        doNo: payload.doNo,
        taxNumber: payload.taxNumber,
      });
      return payload; // return payload so reducer can update state
    } catch (e) {
      return rejectWithValue(
        e instanceof Error ? e.message : 'Failed to update invoice',
      );
    }
  },
);
 
const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    clearInvoiceError(state) {
      state.error = null;
    },
    clearSelectedInvoice(state) {
      state.selectedInvoice = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoices.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (s, a) => {
        s.loading = false;
        s.invoices = a.payload;
      })
      .addCase(fetchInvoices.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload as string;
      })
      .addCase(createInvoice.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(createInvoice.fulfilled, (s, a) => {
        s.loading = false;
        s.invoices.unshift(a.payload);
      })
      .addCase(createInvoice.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload as string;
      })
      .addCase(updateInvoiceMeta.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(updateInvoiceMeta.fulfilled, (s, a) => {
        s.loading = false;
        const idx = s.invoices.findIndex((i) => i.id === a.payload.invoiceId);
        if (idx !== -1) {
          if (a.payload.sesNo !== undefined)
            s.invoices[idx].sesNo = a.payload.sesNo;
          if (a.payload.doNo !== undefined)
            s.invoices[idx].doNo = a.payload.doNo;
          if (a.payload.taxNumber !== undefined)
            s.invoices[idx].taxNumber = a.payload.taxNumber;
        }
      })
      .addCase(updateInvoiceMeta.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload as string;
      });
  },
});

export const { clearInvoiceError, clearSelectedInvoice } = invoiceSlice.actions;
export default invoiceSlice.reducer;
