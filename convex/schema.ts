import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
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
  }).index("by_task_id", ["id"]),
});
