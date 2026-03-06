import { db } from "./db";
import {
  lists,
  tags,
  tasks,
  taskTags,
  subtasks,
  type InsertList,
  type InsertTag,
  type InsertTask,
  type InsertTaskTag,
  type InsertSubtask,
  type TaskWithDetails,
  type ListWithCount
} from "@shared/schema";
import { eq, and, asc, sql } from "drizzle-orm";

export interface IStorage {
  // Lists
  getLists(): Promise<ListWithCount[]>;
  createList(list: InsertList): Promise<typeof lists.$inferSelect>;
  updateList(id: number, updates: Partial<InsertList>): Promise<typeof lists.$inferSelect | undefined>;
  deleteList(id: number): Promise<void>;

  // Tags
  getTags(): Promise<typeof tags.$inferSelect[]>;
  createTag(tag: InsertTag): Promise<typeof tags.$inferSelect>;

  // Tasks
  getTasks(filters?: { listId?: number, date?: string }): Promise<TaskWithDetails[]>;
  getTask(id: number): Promise<TaskWithDetails | undefined>;
  createTask(task: InsertTask): Promise<typeof tasks.$inferSelect>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<typeof tasks.$inferSelect | undefined>;
  deleteTask(id: number): Promise<void>;
  assignTag(taskId: number, tagId: number): Promise<typeof taskTags.$inferSelect>;
  removeTag(taskId: number, tagId: number): Promise<void>;

  // Subtasks
  createSubtask(subtask: InsertSubtask): Promise<typeof subtasks.$inferSelect>;
  updateSubtask(id: number, updates: Partial<InsertSubtask>): Promise<typeof subtasks.$inferSelect | undefined>;
  deleteSubtask(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getLists(): Promise<ListWithCount[]> {
    const results = await db.select({
      id: lists.id,
      name: lists.name,
      color: lists.color,
      createdAt: lists.createdAt,
      taskCount: sql<number>`count(${tasks.id})::int`
    })
    .from(lists)
    .leftJoin(tasks, eq(tasks.listId, lists.id))
    .groupBy(lists.id)
    .orderBy(asc(lists.id));

    return results;
  }

  async createList(list: InsertList) {
    const [result] = await db.insert(lists).values(list).returning();
    return result;
  }

  async updateList(id: number, updates: Partial<InsertList>) {
    const [result] = await db.update(lists).set(updates).where(eq(lists.id, id)).returning();
    return result;
  }

  async deleteList(id: number) {
    await db.delete(lists).where(eq(lists.id, id));
  }

  async getTags() {
    return await db.select().from(tags).orderBy(asc(tags.name));
  }

  async createTag(tag: InsertTag) {
    const [result] = await db.insert(tags).values(tag).returning();
    return result;
  }

  async getTasks(filters?: { listId?: number, date?: string }): Promise<TaskWithDetails[]> {
    // We do multiple queries or fetch everything and assemble it.
    // For simplicity, we'll fetch tasks, then their relations.
    let query = db.select().from(tasks).$dynamic();
    
    if (filters?.listId) {
      query = query.where(eq(tasks.listId, filters.listId));
    }
    
    if (filters?.date) {
      query = query.where(sql`DATE(${tasks.dueDate}) = DATE(${filters.date})`);
    }

    const allTasks = await query;
    const allLists = await db.select().from(lists);
    const allTags = await db.select().from(tags);
    const allTaskTags = await db.select().from(taskTags);
    const allSubtasks = await db.select().from(subtasks);

    return allTasks.map(task => {
      const taskList = allLists.find(l => l.id === task.listId) || null;
      const tTags = allTaskTags.filter(tt => tt.taskId === task.id).map(tt => ({
        ...tt,
        tag: allTags.find(t => t.id === tt.tagId)!
      }));
      const tSubtasks = allSubtasks.filter(s => s.taskId === task.id);

      return {
        ...task,
        list: taskList,
        tags: tTags,
        subtasks: tSubtasks
      };
    });
  }

  async getTask(id: number): Promise<TaskWithDetails | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    if (!task) return undefined;

    const taskList = task.listId ? (await db.select().from(lists).where(eq(lists.id, task.listId)))[0] : null;
    
    const taskTagsRows = await db.select().from(taskTags).where(eq(taskTags.taskId, id));
    const allTags = await db.select().from(tags);
    
    const tTags = taskTagsRows.map(tt => ({
      ...tt,
      tag: allTags.find(t => t.id === tt.tagId)!
    }));

    const tSubtasks = await db.select().from(subtasks).where(eq(subtasks.taskId, id));

    return {
      ...task,
      list: taskList || null,
      tags: tTags,
      subtasks: tSubtasks
    };
  }

  async createTask(task: InsertTask) {
    const [result] = await db.insert(tasks).values(task).returning();
    return result;
  }

  async updateTask(id: number, updates: Partial<InsertTask>) {
    const [result] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return result;
  }

  async deleteTask(id: number) {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async assignTag(taskId: number, tagId: number) {
    const [result] = await db.insert(taskTags).values({ taskId, tagId }).onConflictDoNothing().returning();
    if (!result) {
      // If it already existed, just return the record
      return { taskId, tagId };
    }
    return result;
  }

  async removeTag(taskId: number, tagId: number) {
    await db.delete(taskTags).where(and(eq(taskTags.taskId, taskId), eq(taskTags.tagId, tagId)));
  }

  async createSubtask(subtask: InsertSubtask) {
    const [result] = await db.insert(subtasks).values(subtask).returning();
    return result;
  }

  async updateSubtask(id: number, updates: Partial<InsertSubtask>) {
    const [result] = await db.update(subtasks).set(updates).where(eq(subtasks.id, id)).returning();
    return result;
  }

  async deleteSubtask(id: number) {
    await db.delete(subtasks).where(eq(subtasks.id, id));
  }
}

export const storage = new DatabaseStorage();
