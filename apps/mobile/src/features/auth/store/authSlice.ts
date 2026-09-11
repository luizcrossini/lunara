import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { AuthState, AuthUser } from "../types/auth.types";

const initialState: AuthState = {
  user: null,

  accessToken: null,

  refreshToken: null,

  isAuthenticated: false,

  isLoading: true,
};

interface LoginPayload {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    loginSuccess(state, action: PayloadAction<LoginPayload>) {
      state.user = action.payload.user;

      state.accessToken = action.payload.accessToken;

      state.refreshToken = action.payload.refreshToken;

      state.isAuthenticated = true;

      state.isLoading = false;
    },

    restoreSession(state, action: PayloadAction<LoginPayload>) {
      state.user = action.payload.user;

      state.accessToken = action.payload.accessToken;

      state.refreshToken = action.payload.refreshToken;

      state.isAuthenticated = true;

      state.isLoading = false;
    },

    logoutSuccess(state) {
      state.user = null;

      state.accessToken = null;

      state.refreshToken = null;

      state.isAuthenticated = false;

      state.isLoading = false;
    },

    finishAuthLoading(state) {
      state.isLoading = false;
    },
  },
});

export const {
  loginSuccess,
  restoreSession,
  logoutSuccess,
  finishAuthLoading,
} = authSlice.actions;

export default authSlice.reducer;
