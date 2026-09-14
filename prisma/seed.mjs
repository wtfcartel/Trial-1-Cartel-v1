import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const facility = await prisma.facility.upsert({
    where: { id: "demo-facility" },
    update: {},
    create: {
      id: "demo-facility",
      name: "Riverside Aged Care",
      address: "12 River St, Melbourne VIC",
    },
  });

  await prisma.user.upsert({
    where: { email: "facility@demo.test" },
    update: {},
    create: {
      email: "facility@demo.test",
      passwordHash,
      name: "Sam (Roster Manager)",
      role: "FACILITY_ADMIN",
      facilityId: facility.id,
    },
  });

  const nurse = await prisma.user.upsert({
    where: { email: "nurse@demo.test" },
    update: {},
    create: {
      email: "nurse@demo.test",
      passwordHash,
      name: "Jordan Lee",
      role: "NURSE",
      nurseProfile: {
        create: {
          registrationNo: "AHPRA-1234567",
          qualifications: "RN, Aged Care, Wound Care",
        },
      },
    },
  });

  const now = new Date();
  const in2days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const in2days8h = new Date(in2days.getTime() + 8 * 60 * 60 * 1000);

  await prisma.shift.upsert({
    where: { id: "demo-shift-1" },
    update: {},
    create: {
      id: "demo-shift-1",
      facilityId: facility.id,
      title: "Night shift RN",
      ward: "High Care Wing",
      startsAt: in2days,
      endsAt: in2days8h,
      requiredQualification: "RN, Aged Care experience",
      hourlyRateCents: 6500,
      notes: "Handover at 21:45. Ask for Sam at reception.",
    },
  });

  console.log("Seeded:", { facility: facility.name, nurse: nurse.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
