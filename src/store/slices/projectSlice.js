// src/store/slices/projectSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { setMilestones } from "./milestoneSlice";
// highlight-next-line
import { createMilestone } from "./milestoneSlice"; // Import the action to listen for

export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/projects");
      return response.data.data.projects;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const createProject = createAsyncThunk(
  "projects/createProject",
  async (projectData, { rejectWithValue }) => {
    try {
      const response = await api.post("/projects", projectData);
      return response.data.data?.project || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const fetchProjectDetails = createAsyncThunk(
  "projects/fetchProjectDetails",
  async (projectId, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      const project = response.data.data?.project || response.data;

      if (project && project.milestones) {
        dispatch(setMilestones(project.milestones));
      } else {
        dispatch(setMilestones([]));
      }

      return project;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

const projectSlice = createSlice({
  name: "projects",
  initialState: {
    projects: [],
    currentProject: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.projects = action.payload;
        state.isLoading = false;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.push(action.payload);
        state.isLoading = false;
      })
      .addCase(fetchProjectDetails.fulfilled, (state, action) => {
        state.currentProject = action.payload;
        state.isLoading = false;
      })
      // --- THE FIX IS HERE ---
      // Listen for the successful creation of a milestone
      // highlight-start
      .addCase(createMilestone.fulfilled, (state, action) => {
        // 1. Turn off the project-level loader
        state.isLoading = false;

        // 2. Add the new milestone to the current project's data
        //    This keeps the UI in sync without a full refresh.
        if (state.currentProject) {
          state.currentProject.milestones.push(action.payload);
        }
      })
      // highlight-end
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

export const { clearError } = projectSlice.actions;
export default projectSlice.reducer;