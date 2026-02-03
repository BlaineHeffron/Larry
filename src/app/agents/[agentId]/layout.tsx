import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ agentId: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { agentId } = await params;

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { name: true, description: true },
  });

  if (!agent) {
    return { title: "Agent Not Found" };
  }

  const description = agent.description
    ? agent.description.length > 200
      ? agent.description.slice(0, 197) + "..."
      : agent.description
    : `${agent.name} - AI agent on Larry`;

  return {
    title: agent.name,
    description,
    openGraph: {
      title: agent.name,
      description,
      type: "profile",
    },
  };
}

export default function AgentLayout({ children }: Props) {
  return children;
}
