import { ConviteClient } from "./convite-client";

export default function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  return <ConviteClient tokenPromise={params} />;
}
