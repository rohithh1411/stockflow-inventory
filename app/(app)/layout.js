import Nav from "@/components/Nav";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }) {
  const session = await getSession();
  const org = session
    ? await prisma.organization.findUnique({ where: { id: session.organizationId } })
    : null;

  return (
    <div className="shell">
      <Nav orgName={org?.name ?? ""} />
      <main className="main">{children}</main>
    </div>
  );
}
