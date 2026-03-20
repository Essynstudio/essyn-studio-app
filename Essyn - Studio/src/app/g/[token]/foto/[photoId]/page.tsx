import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ token: string; photoId: string }>;
}

// For MVP, redirect to gallery with photo context
// Full lightbox route will be implemented in Sprint 2 with comments
export default async function PhotoPage({ params }: Props) {
  const { token } = await params;
  redirect(`/g/${token}`);
}
