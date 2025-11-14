import { createSlice } from '@reduxjs/toolkit';

const planningSlice = createSlice({
  name: 'planning',
  initialState: {
    plannings: [],
    loading: false,
    error: null
  },
  reducers: {}
});

export default planningSlice.reducer;
