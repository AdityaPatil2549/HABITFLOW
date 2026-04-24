import { nanoid } from 'nanoid';
import { db } from '../db';
import type { Task, Project } from '../types';
import { format, parseISO, addDays, addWeeks, addMonths } from 'date-fns';

export const taskService = {
  // ─── Tasks ───────────────────────────────────────────────────
  async getAll(): Promise<Task[]> {
    return db.tasks.orderBy('order').toArray();
  },

  async getById(id: string): Promise<Task | undefined> {
    return db.tasks.get(id);
  },

  async getForToday(): Promise<Task[]> {
    const today = format(new Date(), 'yyyy-MM-dd');
    return db.tasks
      .filter(t => !t.completed && t.dueDate !== undefined && t.dueDate <= today)
      .toArray();
  },

  async getSubtasks(parentId: string): Promise<Task[]> {
    return db.tasks.where('parentId').equals(parentId).toArray();
  },

  async create(data: Omit<Task, 'id' | 'createdAt' | 'order'>): Promise<Task> {
    const count = await db.tasks.count();
    const task: Task = {
      ...data,
      id: nanoid(),
      order: count,
      createdAt: new Date().toISOString(),
    };
    await db.tasks.add(task);
    return task;
  },

  async update(id: string, data: Partial<Task>): Promise<void> {
    await db.tasks.update(id, data);
  },

  async complete(id: string): Promise<void> {
    const task = await db.tasks.get(id);
    if (!task) return;

    await db.tasks.update(id, {
      completed: true,
      completedAt: new Date().toISOString(),
    });

    // Spawn next recurrence
    if (task.recurring !== 'none') {
      let nextDueDate: string | undefined;
      const baseDate = task.dueDate ? parseISO(task.dueDate) : new Date();
      if (task.recurring === 'daily') {
        nextDueDate = format(addDays(baseDate, 1), 'yyyy-MM-dd');
      } else if (task.recurring === 'weekly') {
        nextDueDate = format(addWeeks(baseDate, 1), 'yyyy-MM-dd');
      } else if (task.recurring === 'monthly') {
        nextDueDate = format(addMonths(baseDate, 1), 'yyyy-MM-dd');
      } else if (task.recurring === 'custom' && task.recurringInterval) {
        nextDueDate = format(addDays(baseDate, task.recurringInterval), 'yyyy-MM-dd');
      }
      if (nextDueDate) {
        await taskService.create({
          ...task,
          dueDate: nextDueDate,
          completed: false,
          completedAt: undefined,
        });
      }
    }
  },

  async uncomplete(id: string): Promise<void> {
    await db.tasks.update(id, { completed: false, completedAt: undefined });
  },

  async delete(id: string): Promise<void> {
    // Delete subtasks first
    await db.tasks.where('parentId').equals(id).delete();
    await db.tasks.delete(id);
  },

  async reorder(ids: string[]): Promise<void> {
    await db.transaction('rw', db.tasks, async () => {
      for (let i = 0; i < ids.length; i++) {
        await db.tasks.update(ids[i], { order: i });
      }
    });
  },

  // ─── Projects ─────────────────────────────────────────────────
  async getAllProjects(): Promise<Project[]> {
    return db.projects
      .orderBy('order')
      .filter(p => !p.archived)
      .toArray();
  },

  async createProject(data: Omit<Project, 'id' | 'createdAt' | 'order'>): Promise<Project> {
    const count = await db.projects.count();
    const project: Project = {
      ...data,
      id: nanoid(),
      order: count,
      createdAt: new Date().toISOString(),
    };
    await db.projects.add(project);
    return project;
  },

  async updateProject(id: string, data: Partial<Project>): Promise<void> {
    await db.projects.update(id, data);
  },

  async getTasksForProject(projectId: string): Promise<Task[]> {
    return db.tasks.where('projectId').equals(projectId).toArray();
  },
};
