// src/store/slices/milestoneSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// Thunk to create a new milestone for a specific project
export const createMilestone = createAsyncThunk(
  "milestones/createMilestone",
  async ({ projectId, milestoneData }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/${projectId}/milestones`,
        milestoneData
      );
      return response.data.data.milestone;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// Thunk to update an existing milestone
export const updateMilestone = createAsyncThunk(
  "milestones/updateMilestone",
  // highlight-next-line
  async ({ projectId, milestoneId, updateData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/${projectId}/milestones/${milestoneId}`,
        updateData
      );
      return response.data.data.milestone;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// Thunk to reorder milestones
export const reorderMilestones = createAsyncThunk(
  "milestones/reorderMilestones",
  // highlight-next-line
  async ({ projectId, milestones }, { rejectWithValue }) => {
    try {
      await api.patch(`/${projectId}/milestones`, { milestones });
      return milestones;
    } catch (error) {
      console.error("Error reordering milestones:", error);
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

const milestoneSlice = createSlice({
  name: "milestones",
  initialState: {
    milestones: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    setMilestones: (state, action) => {
      state.milestones = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createMilestone.fulfilled, (state, action) => {
        state.milestones.push(action.payload);
        state.isLoading = false;
      })
      .addCase(updateMilestone.fulfilled, (state, action) => {
        const index = state.milestones.findIndex(
          (m) => m._id === action.payload._id
        );
        if (index !== -1) {
          state.milestones[index] = action.payload;
        }
        state.isLoading = false;
      })
      .addCase(reorderMilestones.fulfilled, (state, action) => {
        action.payload.forEach((updatedMilestone) => {
          const existingMilestone = state.milestones.find(
            (m) => m._id === updatedMilestone.id
          );
          if (existingMilestone) {
            existingMilestone.order = updatedMilestone.order;
          }
        });
        state.milestones.sort((a, b) => a.order - b.order);
        state.isLoading = false;
      })
      .addMatcher(
        (action) => action.type.endsWith("/pending"),
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          state.isLoading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { setMilestones, clearError } = milestoneSlice.actions;
export default milestoneSlice.reducer;