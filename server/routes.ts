import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

async function seedDatabase() {
  const existingLists = await storage.getLists();
  if (existingLists.length === 0) {
    // Create default lists
    const personalList = await storage.createList({ name: "Personal", color: "#EF4444" });
    const workList = await storage.createList({ name: "Work", color: "#3B82F6" });
    const list1 = await storage.createList({ name: "List 1", color: "#F59E0B" });

    // Create default tags
    const tag1 = await storage.createTag({ name: "Tag 1" });
    const tag2 = await storage.createTag({ name: "Tag 2" });

    // Create default tasks
    const task1 = await storage.createTask({
      title: "Research content ideas",
      completed: false,
    });

    const task2 = await storage.createTask({
      title: "Create a database of guest authors",
      completed: false,
    });

    const task3 = await storage.createTask({
      title: "Renew driver's license",
      listId: personalList.id,
      dueDate: new Date("2022-03-22").toISOString(),
      completed: false,
    });

    const task4 = await storage.createTask({
      title: "Consult accountant",
      listId: list1.id,
      completed: false,
    });

    const task5 = await storage.createTask({
      title: "Print business card",
      completed: false,
    });

    // Add subtasks
    await storage.createSubtask({ taskId: task3.id, title: "Subtask", completed: false });
    await storage.createSubtask({ taskId: task4.id, title: "Subtask 1", completed: false });
    await storage.createSubtask({ taskId: task4.id, title: "Subtask 2", completed: false });
    await storage.createSubtask({ taskId: task4.id, title: "Subtask 3", completed: false });

    // Add tags
    await storage.assignTag(task3.id, tag1.id);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Lists
  app.get(api.lists.list.path, async (req, res) => {
    const lists = await storage.getLists();
    res.json(lists);
  });

  app.post(api.lists.create.path, async (req, res) => {
    try {
      const input = api.lists.create.input.parse(req.body);
      const list = await storage.createList(input);
      res.status(201).json(list);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.put(api.lists.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.lists.update.input.parse(req.body);
      const list = await storage.updateList(id, input);
      if (!list) return res.status(404).json({ message: "List not found" });
      res.json(list);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete(api.lists.delete.path, async (req, res) => {
    await storage.deleteList(parseInt(req.params.id));
    res.status(204).end();
  });

  // Tags
  app.get(api.tags.list.path, async (req, res) => {
    const tags = await storage.getTags();
    res.json(tags);
  });

  app.post(api.tags.create.path, async (req, res) => {
    try {
      const input = api.tags.create.input.parse(req.body);
      const tag = await storage.createTag(input);
      res.status(201).json(tag);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  // Tasks
  app.get(api.tasks.list.path, async (req, res) => {
    const listId = req.query.listId ? parseInt(req.query.listId as string) : undefined;
    const date = req.query.date as string;
    const tasks = await storage.getTasks({ listId, date });
    res.json(tasks);
  });

  app.get(api.tasks.get.path, async (req, res) => {
    const task = await storage.getTask(parseInt(req.params.id));
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  });

  app.post(api.tasks.create.path, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const task = await storage.createTask(input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.put(api.tasks.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.tasks.update.input.parse(req.body);
      const task = await storage.updateTask(id, input);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete(api.tasks.delete.path, async (req, res) => {
    await storage.deleteTask(parseInt(req.params.id));
    res.status(204).end();
  });

  app.post(api.tasks.assignTag.path, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const input = api.tasks.assignTag.input.parse(req.body);
      const taskTag = await storage.assignTag(taskId, input.tagId);
      res.status(201).json(taskTag);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete(api.tasks.removeTag.path, async (req, res) => {
    await storage.removeTag(parseInt(req.params.id), parseInt(req.params.tagId));
    res.status(204).end();
  });

  // Subtasks
  app.post(api.subtasks.create.path, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const input = api.subtasks.create.input.parse(req.body);
      const subtask = await storage.createSubtask({ taskId, title: input.title });
      res.status(201).json(subtask);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.put(api.subtasks.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.subtasks.update.input.parse(req.body);
      const subtask = await storage.updateSubtask(id, input);
      if (!subtask) return res.status(404).json({ message: "Subtask not found" });
      res.json(subtask);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete(api.subtasks.delete.path, async (req, res) => {
    await storage.deleteSubtask(parseInt(req.params.id));
    res.status(204).end();
  });

  // Seed the database
  seedDatabase().catch(console.error);

  return httpServer;
}
