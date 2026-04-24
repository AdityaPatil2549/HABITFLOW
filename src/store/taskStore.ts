import { create } from 'zustand';
import { taskService } from '../services/taskService';
import type { Task, Project } from '../types';
import { useGamificationStore } from './gamificationStore';

interface TaskStore {
  tasks: Task[];
  projects: Project[];
  loading: boolean;
  // Actions
  loadTasks: () => Promise<void>;
  addTask: (data: Omit<Task, 'id' | 'createdAt' | 'order'>) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  uncompleteTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'order'>) => Promise<void>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  projects: [],
  loading: false,

  loadTasks: async () => {
    set({ loading: true });
    try {
      const [tasks, projects] = await Promise.all([
        taskService.getAll(),
        taskService.getAllProjects(),
      ]);
      set({ tasks, projects, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addTask: async data => {
    await taskService.create(data);
    await get().loadTasks();
  },

  updateTask: async (id, data) => {
    await taskService.update(id, data);
    await get().loadTasks();
  },

  completeTask: async id => {
    await taskService.complete(id);
    await get().loadTasks();
    await useGamificationStore.getState().addXP(20);
  },

  uncompleteTask: async id => {
    await taskService.uncomplete(id);
    await get().loadTasks();
  },

  deleteTask: async id => {
    await taskService.delete(id);
    await get().loadTasks();
  },

  addProject: async data => {
    await taskService.createProject(data);
    await get().loadTasks();
  },
}));
