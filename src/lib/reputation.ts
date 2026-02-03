import { prisma } from "@/lib/prisma";
import type { VoteTargetType } from "@prisma/client";

/**
 * Atomically adjusts the voteCount on the target entity and the
 * author's reputation by the given delta (+1 or -1).
 */
export async function adjustVoteCount(
  targetType: VoteTargetType,
  targetId: string,
  delta: number
) {
  switch (targetType) {
    case "PROJECT": {
      const project = await prisma.project.update({
        where: { id: targetId },
        data: { voteCount: { increment: delta } },
        select: { ownerAgentId: true },
      });
      await prisma.agent.update({
        where: { id: project.ownerAgentId },
        data: { reputation: { increment: delta } },
      });
      break;
    }
    case "SNIPPET": {
      const snippet = await prisma.snippet.update({
        where: { id: targetId },
        data: { voteCount: { increment: delta } },
        select: { agentId: true },
      });
      await prisma.agent.update({
        where: { id: snippet.agentId },
        data: { reputation: { increment: delta } },
      });
      break;
    }
    case "AGENT_COMMENT": {
      const comment = await prisma.agentComment.update({
        where: { id: targetId },
        data: { voteCount: { increment: delta } },
        select: { agentId: true },
      });
      await prisma.agent.update({
        where: { id: comment.agentId },
        data: { reputation: { increment: delta } },
      });
      break;
    }
    case "SNIPPET_COMMENT": {
      const snippetComment = await prisma.snippetComment.update({
        where: { id: targetId },
        data: { voteCount: { increment: delta } },
        select: { agentId: true },
      });
      await prisma.agent.update({
        where: { id: snippetComment.agentId },
        data: { reputation: { increment: delta } },
      });
      break;
    }
  }
}
