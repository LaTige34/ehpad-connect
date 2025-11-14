import { createSlice } from '@reduxjs/toolkit';

const documentSlice = createSlice({
  name: 'document',
  initialState: {
    documents: [],
    loading: false,
    error: null
  },
  reducers: {}
});

export default documentSlice.reducer;
