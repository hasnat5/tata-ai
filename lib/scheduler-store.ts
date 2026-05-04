import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SchedulerProject, ScheduledPost } from "./scheduler-types";

type SchedulerState = {
  // ========== HYDRATION ==========
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // ========== SCHEDULER PROJECT ==========
  schedulerProject: SchedulerProject | null;

  // ========== ACTIONS: PROJECT ==========
  initSchedulerProject: (projectId: string) => void;
  setSchedulerProject: (project: SchedulerProject) => void;

  // ========== ACTIONS: POSTS ==========
  addScheduledPost: (post: ScheduledPost) => void;
  updateScheduledPost: (postId: string, updates: Partial<ScheduledPost>) => void;
  deleteScheduledPost: (postId: string) => void;
  getPostsByDate: (date: Date) => ScheduledPost[];
  getPostsByMonth: (year: number, month: number) => ScheduledPost[];
};

export const useSchedulerStore = create<SchedulerState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      schedulerProject: null,

      initSchedulerProject: (projectId) => {
        set({
          schedulerProject: {
            id: crypto.randomUUID(),
            projectId,
            posts: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        });
      },

      setSchedulerProject: (project) => {
        set({ schedulerProject: project });
      },

      addScheduledPost: (post) => {
        set((state) => {
          if (!state.schedulerProject) return state;
          return {
            schedulerProject: {
              ...state.schedulerProject,
              posts: [...state.schedulerProject.posts, post],
              updatedAt: Date.now(),
            },
          };
        });
      },

      updateScheduledPost: (postId, updates) => {
        set((state) => {
          if (!state.schedulerProject) return state;
          return {
            schedulerProject: {
              ...state.schedulerProject,
              posts: state.schedulerProject.posts.map((post) =>
                post.id === postId ? { ...post, ...updates } : post
              ),
              updatedAt: Date.now(),
            },
          };
        });
      },

      deleteScheduledPost: (postId) => {
        set((state) => {
          if (!state.schedulerProject) return state;
          return {
            schedulerProject: {
              ...state.schedulerProject,
              posts: state.schedulerProject.posts.filter(
                (post) => post.id !== postId
              ),
              updatedAt: Date.now(),
            },
          };
        });
      },

      getPostsByDate: (date) => {
        const state = get();
        if (!state.schedulerProject) return [];

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        return state.schedulerProject.posts.filter((post) => {
          const postDate = new Date(post.scheduledDate);
          postDate.setHours(0, 0, 0, 0);
          return postDate.getTime() === targetDate.getTime();
        });
      },

      getPostsByMonth: (year, month) => {
        const state = get();
        if (!state.schedulerProject) return [];

        return state.schedulerProject.posts.filter((post) => {
          const postDate = new Date(post.scheduledDate);
          return (
            postDate.getFullYear() === year && postDate.getMonth() === month
          );
        });
      },
    }),
    {
      name: "scheduler-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);
