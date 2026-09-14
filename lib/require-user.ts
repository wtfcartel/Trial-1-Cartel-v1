import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { Role } from "@prisma/client";

export async function requireUser(role?: Role) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { nurseProfile: true },
  });
  if (!user) throw new Error("Not authenticated");
  if (role && user.role !== role) throw new Error("Not authorized");
  return user;
}
