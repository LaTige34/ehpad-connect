import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  theme: 'light',
  language: 'fr',
  notifications: {
    show: false,
    message: '',
    severity: 'info'
  },
  loading: {
    global: false,
    message: ''
  },
  modal: {
    open: false,
    type: null,
    data: null
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    showNotification: (state, action) => {
      state.notifications = {
        show: true,
        message: action.payload.message,
        severity: action.payload.severity || 'info'
      };
    },
    hideNotification: (state) => {
      state.notifications.show = false;
    },
    setGlobalLoading: (state, action) => {
      state.loading = {
        global: action.payload.loading,
        message: action.payload.message || ''
      };
    },
    openModal: (state, action) => {
      state.modal = {
        open: true,
        type: action.payload.type,
        data: action.payload.data || null
      };
    },
    closeModal: (state) => {
      state.modal = {
        open: false,
        type: null,
        data: null
      };
    }
  }
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setLanguage,
  showNotification,
  hideNotification,
  setGlobalLoading,
  openModal,
  closeModal
} = uiSlice.actions;

export default uiSlice.reducer;
