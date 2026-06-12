import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/* ═══════════════════════════════════════════════════
   UI Slice — sidebar, theme, modals, toasts
   ═══════════════════════════════════════════════════ */

interface UiState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  theme: 'light' | 'dark';
}

const initialState: UiState = {
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  theme: 'light',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    toggleMobileSidebar(state) {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    setMobileSidebarOpen(state, action: PayloadAction<boolean>) {
      state.mobileSidebarOpen = action.payload;
    },
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileSidebar,
  setMobileSidebarOpen,
  setTheme,
} = uiSlice.actions;

/* Selectors */
export const selectSidebarCollapsed = (state: { ui: UiState }) =>
  state.ui.sidebarCollapsed;
export const selectMobileSidebarOpen = (state: { ui: UiState }) =>
  state.ui.mobileSidebarOpen;
export const selectTheme = (state: { ui: UiState }) => state.ui.theme;

export default uiSlice.reducer;
