import { pgTable, text, serial, integer, boolean, timestamp, date, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#ccc"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  listId: integer("list_id").references(() => lists.id),
  dueDate: date("due_date"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taskTags = pgTable("task_tags", {
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.taskId, t.tagId] }),
}));

export const subtasks = pgTable("subtasks", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const listsRelations = relations(lists, ({ many }) => ({
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  list: one(lists, {
    fields: [tasks.listId],
    references: [lists.id],
  }),
  tags: many(taskTags),
  subtasks: many(subtasks),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  tasks: many(taskTags),
}));

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, {
    fields: [taskTags.taskId],
    references: [tasks.id],
  }),
  tag: one(tags, {
    fields: [taskTags.tagId],
    references: [tags.id],
  }),
}));

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.taskId],
    references: [tasks.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertListSchema = createInsertSchema(lists).omit({ id: true, createdAt: true });
export const insertTagSchema = createInsertSchema(tags).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertTaskTagSchema = createInsertSchema(taskTags);
export const insertSubtaskSchema = createInsertSchema(subtasks).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===

// Base types
export type List = typeof lists.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TaskTag = typeof taskTags.$inferSelect;
export type Subtask = typeof subtasks.$inferSelect;

export type InsertList = z.infer<typeof insertListSchema>;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertTaskTag = z.infer<typeof insertTaskTagSchema>;
export type InsertSubtask = z.infer<typeof insertSubtaskSchema>;

// Complex responses
export type TaskWithDetails = Task & {
  list: List | null;
  tags: (TaskTag & { tag: Tag })[];
  subtasks: Subtask[];
};

export type ListWithCount = List & {
  taskCount: number;
};

// Request types
export type CreateListRequest = InsertList;
export type UpdateListRequest = Partial<InsertList>;

export type CreateTagRequest = InsertTag;

export type CreateTaskRequest = InsertTask;
export type UpdateTaskRequest = Partial<InsertTask>;

export type CreateSubtaskRequest = InsertSubtask;
export type UpdateSubtaskRequest = Partial<InsertSubtask>;

export type AssignTagRequest = InsertTaskTag;
