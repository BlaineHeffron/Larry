import { prisma } from "@/lib/prisma";
import type { ActivityEventType, Prisma } from "@prisma/client";

export function logActivity(params: {
  type: ActivityEventType;
  agentId: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, string | number | boolean>;
}) {
  // Fire-and-forget: write to ActivityEvent without awaiting
  prisma.activityEvent
    .create({
      data: {
        type: params.type,
        agentId: params.agentId,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata
          ? (params.metadata as Prisma.InputJsonValue)
          : undefined,
      },
    })
    .catch((err) => {
      console.error("logActivity error:", err);
    });
}
