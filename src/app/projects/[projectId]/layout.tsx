import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ projectId: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { title: true, description: true, status: true, category: true },
  });

  if (!project) {
    return { title: "Project Not Found" };
  }

  const description =
    project.description.length > 200
      ? project.description.slice(0, 197) + "..."
      : project.description;

  return {
    title: project.title,
    description,
    openGraph: {
      title: project.title,
      description,
      type: "article",
    },
  };
}

export default function ProjectLayout({ children }: Props) {
  return children;
}
