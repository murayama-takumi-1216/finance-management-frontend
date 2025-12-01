import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, accountsAPI, categoriesAPI, tagsAPI, tasksAPI, eventsAPI, remindersAPI } from '../services/api';

// Auth Store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Initialize auth state on app load - validates token if exists
      initializeAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false, isInitialized: true, user: null, token: null });
          return;
        }

        try {
          const { data } = await authAPI.getProfile();
          set({
            user: data.user,
            token: token,
            isAuthenticated: true,
            isInitialized: true,
          });
        } catch (error) {
          // Token is invalid or expired
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isInitialized: true,
          });
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authAPI.login({ email, password });
          localStorage.setItem('token', data.token);
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
          return data;
        } catch (error) {
          set({
            error: error.response?.data?.error || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (nombre, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authAPI.register({ nombre, email, password });
          localStorage.setItem('token', data.token);
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
          });
          return data;
        } catch (error) {
          set({
            error: error.response?.data?.error || 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      fetchProfile: async () => {
        try {
          const { data } = await authAPI.getProfile();
          set({ user: { ...get().user, ...data.user } });
          return data;
        } catch (error) {
          if (error.response?.status === 401) {
            get().logout();
          }
          throw error;
        }
      },

      updateProfile: async (profileData) => {
        try {
          const { data } = await authAPI.updateProfile(profileData);
          set({ user: { ...get().user, ...data.user } });
          return data;
        } catch (error) {
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, we need to validate the token
        // Set isInitialized to false so App knows to call initializeAuth
        if (state) {
          state.isInitialized = false;
        }
      },
    }
  )
);

// Accounts Store
export const useAccountsStore = create((set, get) => ({
  accounts: [],
  currentAccount: null,
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    set({ isLoading: true });
    try {
      const { data } = await accountsAPI.getAll();
      set({ accounts: data.accounts, isLoading: false });
      return data.accounts;
    } catch (error) {
      set({ error: error.response?.data?.error, isLoading: false });
      throw error;
    }
  },

  fetchAccountById: async (accountId) => {
    set({ isLoading: true });
    try {
      const { data } = await accountsAPI.getById(accountId);
      set({ currentAccount: data, isLoading: false });
      return data;
    } catch (error) {
      set({ error: error.response?.data?.error, isLoading: false });
      throw error;
    }
  },

  createAccount: async (accountData) => {
    try {
      const { data } = await accountsAPI.create(accountData);
      set({ accounts: [...get().accounts, data.account] });
      return data.account;
    } catch (error) {
      throw error;
    }
  },

  updateAccount: async (accountId, accountData) => {
    try {
      const { data } = await accountsAPI.update(accountId, accountData);
      set({
        accounts: get().accounts.map((a) =>
          a.id === accountId ? { ...a, ...data.account } : a
        ),
        currentAccount:
          get().currentAccount?.id === accountId
            ? { ...get().currentAccount, ...data.account }
            : get().currentAccount,
      });
      return data.account;
    } catch (error) {
      throw error;
    }
  },

  deleteAccount: async (accountId) => {
    try {
      await accountsAPI.delete(accountId);
      set({
        accounts: get().accounts.filter((a) => a.id !== accountId),
        currentAccount:
          get().currentAccount?.id === accountId ? null : get().currentAccount,
      });
    } catch (error) {
      throw error;
    }
  },

  setCurrentAccount: (account) => set({ currentAccount: account }),
  clearCurrentAccount: () => set({ currentAccount: null }),
}));

// Categories Store
export const useCategoriesStore = create((set, get) => ({
  categories: [],
  isLoading: false,

  fetchCategories: async (accountId, tipo = null) => {
    set({ isLoading: true });
    try {
      const params = tipo ? { tipo } : {};
      const { data } = await categoriesAPI.getAll(accountId, params);
      set({ categories: data.categories, isLoading: false });
      return data.categories;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createCategory: async (accountId, categoryData) => {
    try {
      const { data } = await categoriesAPI.create(accountId, categoryData);
      set({ categories: [...get().categories, data.category] });
      return data.category;
    } catch (error) {
      throw error;
    }
  },

  updateCategory: async (accountId, categoryId, categoryData) => {
    try {
      const { data } = await categoriesAPI.update(accountId, categoryId, categoryData);
      set({
        categories: get().categories.map((c) =>
          c.id === categoryId ? { ...c, ...data.category } : c
        ),
      });
      return data.category;
    } catch (error) {
      throw error;
    }
  },

  deleteCategory: async (accountId, categoryId) => {
    try {
      await categoriesAPI.delete(accountId, categoryId);
      set({ categories: get().categories.filter((c) => c.id !== categoryId) });
    } catch (error) {
      throw error;
    }
  },
}));

// Tags Store
export const useTagsStore = create((set, get) => ({
  tags: [],
  isLoading: false,

  fetchTags: async (accountId) => {
    set({ isLoading: true });
    try {
      const { data } = await tagsAPI.getAll(accountId);
      set({ tags: data.tags, isLoading: false });
      return data.tags;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createTag: async (accountId, tagData) => {
    try {
      const { data } = await tagsAPI.create(accountId, tagData);
      set({ tags: [...get().tags, data.tag] });
      return data.tag;
    } catch (error) {
      throw error;
    }
  },

  updateTag: async (accountId, tagId, tagData) => {
    try {
      const { data } = await tagsAPI.update(accountId, tagId, tagData);
      set({
        tags: get().tags.map((t) => (t.id === tagId ? { ...t, ...data.tag } : t)),
      });
      return data.tag;
    } catch (error) {
      throw error;
    }
  },

  deleteTag: async (accountId, tagId) => {
    try {
      await tagsAPI.delete(accountId, tagId);
      set({ tags: get().tags.filter((t) => t.id !== tagId) });
    } catch (error) {
      throw error;
    }
  },
}));

// Tasks Store
export const useTasksStore = create((set, get) => ({
  tasks: [],
  summary: null,
  pagination: null,
  isLoading: false,

  fetchTasks: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await tasksAPI.getAll(params);
      set({
        tasks: data.data,
        pagination: data.pagination,
        isLoading: false,
      });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchSummary: async () => {
    try {
      const { data } = await tasksAPI.getSummary();
      set({ summary: data });
      return data;
    } catch (error) {
      throw error;
    }
  },

  createTask: async (taskData) => {
    try {
      const { data } = await tasksAPI.create(taskData);
      set({ tasks: [data.task, ...get().tasks] });
      return data.task;
    } catch (error) {
      throw error;
    }
  },

  updateTask: async (taskId, taskData) => {
    try {
      const { data } = await tasksAPI.update(taskId, taskData);
      set({
        tasks: get().tasks.map((t) =>
          t.id === taskId ? { ...t, ...data.task } : t
        ),
      });
      return data.task;
    } catch (error) {
      throw error;
    }
  },

  updateTaskStatus: async (taskId, estado, comentario = null) => {
    try {
      const { data } = await tasksAPI.updateStatus(taskId, { estado, comentario });
      set({
        tasks: get().tasks.map((t) =>
          t.id === taskId ? { ...t, estado: data.task.estadoNuevo } : t
        ),
      });
      return data.task;
    } catch (error) {
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    try {
      await tasksAPI.delete(taskId);
      set({ tasks: get().tasks.filter((t) => t.id !== taskId) });
    } catch (error) {
      throw error;
    }
  },
}));

// Events Store
export const useEventsStore = create((set, get) => ({
  events: [],
  upcomingEvents: [],
  reminders: [],
  pagination: null,
  isLoading: false,

  fetchEvents: async (accountId, params = {}) => {
    set({ isLoading: true });
    try {
      let data;
      if (accountId) {
        const response = await eventsAPI.getByAccount(accountId, params);
        data = response.data;
        // Backend returns array directly for account events
        const events = Array.isArray(data) ? data : (data.events || data.data || []);
        set({
          events,
          pagination: data.pagination,
          isLoading: false,
        });
      } else {
        const response = await eventsAPI.getAll(params);
        data = response.data;
        set({
          events: data.data || data.events || [],
          pagination: data.pagination,
          isLoading: false,
        });
      }
      return data;
    } catch (error) {
      set({ isLoading: false, events: [] });
      throw error;
    }
  },

  fetchUpcomingEvents: async (limit = 5) => {
    try {
      const { data } = await eventsAPI.getUpcoming(limit);
      set({ upcomingEvents: data.events || [] });
      return data.events || [];
    } catch (error) {
      throw error;
    }
  },

  fetchEventsByDateRange: async (startDate, endDate) => {
    try {
      const { data } = await eventsAPI.getByDateRange(startDate, endDate);
      set({ events: data.events || [] });
      return data.events || [];
    } catch (error) {
      throw error;
    }
  },

  createEvent: async (accountId, eventData) => {
    try {
      let data;
      if (accountId) {
        const response = await eventsAPI.createForAccount(accountId, eventData);
        data = response.data;
      } else {
        const response = await eventsAPI.create(eventData);
        data = response.data;
      }
      // Backend returns event directly for account events, or { event: ... } for global
      const newEvent = data.event || data;
      set({ events: [...get().events, newEvent] });
      return newEvent;
    } catch (error) {
      throw error;
    }
  },

  updateEvent: async (accountId, eventId, eventData) => {
    try {
      let data;
      if (accountId) {
        const response = await eventsAPI.updateForAccount(accountId, eventId, eventData);
        data = response.data;
      } else {
        const response = await eventsAPI.update(eventId, eventData);
        data = response.data;
      }
      // Backend returns event directly for account events, or { event: ... } for global
      const updatedEvent = data.event || data;
      set({
        events: get().events.map((e) =>
          e.id === eventId ? { ...e, ...updatedEvent } : e
        ),
      });
      return updatedEvent;
    } catch (error) {
      throw error;
    }
  },

  deleteEvent: async (accountId, eventId) => {
    try {
      if (accountId) {
        await eventsAPI.deleteForAccount(accountId, eventId);
      } else {
        await eventsAPI.delete(eventId);
      }
      set({ events: get().events.filter((e) => e.id !== eventId) });
    } catch (error) {
      throw error;
    }
  },

  // Reminders
  fetchReminders: async (accountId) => {
    try {
      if (accountId) {
        const { data } = await remindersAPI.getByAccount(accountId);
        set({ reminders: data.reminders || [] });
        return data.reminders || [];
      }
      set({ reminders: [] });
      return [];
    } catch (error) {
      set({ reminders: [] });
      throw error;
    }
  },

  createReminder: async (accountId, reminderData) => {
    try {
      const { data } = await remindersAPI.createForAccount(accountId, reminderData);
      set({ reminders: [...get().reminders, data.reminder] });
      return data.reminder;
    } catch (error) {
      throw error;
    }
  },

  deleteReminder: async (accountId, reminderId) => {
    try {
      await remindersAPI.deleteForAccount(accountId, reminderId);
      set({ reminders: get().reminders.filter((r) => r.id !== reminderId) });
    } catch (error) {
      throw error;
    }
  },
}));

// UI Store (for sidebar, modals, etc.)
export const useUIStore = create((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
