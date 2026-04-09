import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";

const taskValidator = {
  id: v.string(),
  title: v.string(),
  description: v.string(),
  owner: v.string(),
  status: v.union(
    v.literal("todo"),
    v.literal("progress"),
    v.literal("review"),
    v.literal("done"),
    v.literal("blocked")
  ),
  priority: v.union(
    v.literal("critical"),
    v.literal("high"),
    v.literal("medium"),
    v.literal("low")
  ),
  dueDate: v.string(),
  tags: v.array(v.string()),
  deliverable: v.string(),
  verified: v.boolean(),
  milestoneId: v.optional(v.string()),
};

export const list = queryGeneric({
  args: {},
  returns: v.array(v.object(taskValidator)),
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    return tasks
      .map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        owner: task.owner,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        tags: task.tags,
        deliverable: task.deliverable,
        verified: task.verified,
        milestoneId: task.milestoneId,
      }))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  },
});

export const seed = mutationGeneric({
  args: { tasks: v.array(v.object(taskValidator)) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("tasks").take(1);
    if (existing.length > 0) return null;

    for (const task of args.tasks) {
      await ctx.db.insert("tasks", task);
    }
    return null;
  },
});

export const create = mutationGeneric({
  args: { task: v.object(taskValidator) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("tasks", args.task);
    return null;
  },
});

export const update = mutationGeneric({
  args: {
    id: v.string(),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      owner: v.optional(v.string()),
      status: v.optional(
        v.union(
          v.literal("todo"),
          v.literal("progress"),
          v.literal("review"),
          v.literal("done"),
          v.literal("blocked")
        )
      ),
      priority: v.optional(
        v.union(
          v.literal("critical"),
          v.literal("high"),
          v.literal("medium"),
          v.literal("low")
        )
      ),
      dueDate: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      deliverable: v.optional(v.string()),
      verified: v.optional(v.boolean()),
      milestoneId: v.optional(v.string()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_task_id", (q) => q.eq("id", args.id))
      .unique();
    if (!task) {
      throw new Error("Task not found");
    }
    await ctx.db.patch(task._id, args.updates);
    return null;
  },
});

export const remove = mutationGeneric({
  args: { id: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_task_id", (q) => q.eq("id", args.id))
      .unique();
    if (!task) {
      return null;
    }
    await ctx.db.delete(task._id);
    return null;
  },
});

export const clearAll = mutationGeneric({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").take(500);
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }
    return null;
  },
});
