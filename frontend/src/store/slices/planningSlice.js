import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  plannings: [],
  currentPlanning: null,
  loading: false,
  error: null
};

const planningSlice = createSlice({
  name: 'planning',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setPlannings: (state, action) => {
      state.plannings = action.payload;
      state.loading = false;
      state.error = null;
    },
    setCurrentPlanning: (state, action) => {
      state.currentPlanning = action.payload;
    },
    addPlanning: (state, action) => {
      state.plannings.push(action.payload);
    },
    updatePlanning: (state, action) => {
      const index = state.plannings.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.plannings[index] = action.payload;
      }
    },
    deletePlanning: (state, action) => {
      state.plannings = state.plannings.filter(p => p.id !== action.payload);
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
  setPlannings,
  setCurrentPlanning,
  addPlanning,
  updatePlanning,
  deletePlanning,
  setError,
  clearError
} = planningSlice.actions;

export default planningSlice.reducer;
