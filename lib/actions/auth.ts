"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";

export type ActionState = { error?: string } | undefined;

const registerSchema = z.object({
  role: z.enum(["FACILITY_ADMIN", "NURSE"]),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  facilityName: z.string().optional(),
  facilityAddress: z.string().optional(),
  registrationNo: z.string().optional(),
  qualifications: z.string().optional(),
});

export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { error: "An account with that email already exists" };
  }

  const passwordHash = await hashPassword(data.password);

  if (data.role === "FACILITY_ADMIN") {
    if (!data.facilityName || !data.facilityAddress) {
      return { error: "Facility name and address are required" };
    }
    const facility = await prisma.facility.create({
      data: { name: data.facilityName, address: data.facilityAddress },
    });
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: "FACILITY_ADMIN",
        facilityId: facility.id,
      },
    });
    await createSession({ userId: user.id, role: user.role });
  } else {
    if (!data.registrationNo || !data.qualifications) {
      return { error: "Registration number and qualifications are required" };
    }
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: "NURSE",
        nurseProfile: {
          create: {
            registrationNo: data.registrationNo,
            qualifications: data.qualifications,
          },
        },
      },
    });
    await createSession({ userId: user.id, role: user.role });
  }

  redirect("/dashboard");
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Invalid email or password" };
  }

  await createSession({ userId: user.id, role: user.role });
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
