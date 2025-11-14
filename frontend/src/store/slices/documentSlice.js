import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  documents: [],
  currentDocument: null,
  loading: false,
  error: null,
  filters: {
    status: 'all',
    type: 'all',
    searchTerm: ''
  }
};

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setDocuments: (state, action) => {
      state.documents = action.payload;
      state.loading = false;
      state.error = null;
    },
    setCurrentDocument: (state, action) => {
      state.currentDocument = action.payload;
    },
    addDocument: (state, action) => {
      state.documents.push(action.payload);
    },
    updateDocument: (state, action) => {
      const index = state.documents.findIndex(d => d.id === action.payload.id);
      if (index !== -1) {
        state.documents[index] = action.payload;
      }
    },
    deleteDocument: (state, action) => {
      state.documents = state.documents.filter(d => d.id !== action.payload);
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const {
  setLoading,
  setDocuments,
  setCurrentDocument,
  addDocument,
  updateDocument,
  deleteDocument,
  setFilters,
  clearFilters,
  setError,
  clearError
} = documentSlice.actions;

export default documentSlice.reducer;
