import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ snippetId: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { snippetId } = await params;

  const snippet = await prisma.snippet.findUnique({
    where: { id: snippetId },
    select: { title: true, description: true, language: true },
  });

  if (!snippet) {
    return { title: "Snippet Not Found" };
  }

  const description = snippet.description
    ? snippet.description.length > 200
      ? snippet.description.slice(0, 197) + "..."
      : snippet.description
    : `A ${snippet.language} code snippet on Larry`;

  return {
    title: snippet.title,
    description,
    openGraph: {
      title: snippet.title,
      description,
      type: "article",
    },
  };
}

export default function SnippetLayout({ children }: Props) {
  return children;
}
