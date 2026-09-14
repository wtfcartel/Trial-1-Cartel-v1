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

  await prisma.user.upsert({
    where: { email: "admin@demo.test" },
    update: {},
    create: {
      email: "admin@demo.test",
      passwordHash,
      name: "Priya (Compliance)",
      role: "ADMIN",
    },
  });

  const inductionModulesData = [
    {
      id: "induction-manual-handling",
      title: "Manual handling",
      description: "Safe patient handling and lifting techniques.",
      order: 1,
    },
    {
      id: "induction-infection-control",
      title: "Infection control",
      description: "Hand hygiene, PPE, and standard precautions.",
      order: 2,
    },
    {
      id: "induction-fire-safety",
      title: "Fire safety",
      description: "Evacuation procedures and fire equipment locations.",
      order: 3,
    },
  ];
  for (const inductionModule of inductionModulesData) {
    await prisma.inductionModule.upsert({
      where: { id: inductionModule.id },
      update: {},
      create: inductionModule,
    });
  }

  // A fully onboarded nurse — verified, induction complete — so the core
  // claim/confirm flow keeps working out of the box.
  const verifiedNurse = await prisma.user.upsert({
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
          verificationStatus: "VERIFIED",
          verifiedAt: new Date(),
        },
      },
    },
    include: { nurseProfile: true },
  });
  if (verifiedNurse.nurseProfile) {
    for (const inductionModule of inductionModulesData) {
      await prisma.inductionProgress.upsert({
        where: {
          nurseProfileId_moduleId: {
            nurseProfileId: verifiedNurse.nurseProfile.id,
            moduleId: inductionModule.id,
          },
        },
        update: {},
        create: { nurseProfileId: verifiedNurse.nurseProfile.id, moduleId: inductionModule.id },
      });
    }
  }

  // A newly signed-up nurse who hasn't finished onboarding yet — demonstrates
  // the verification/induction gate and the admin review queue.
  await prisma.user.upsert({
    where: { email: "newnurse@demo.test" },
    update: {},
    create: {
      email: "newnurse@demo.test",
      passwordHash,
      name: "Alex Chen",
      role: "NURSE",
      nurseProfile: {
        create: {
          registrationNo: "AHPRA-7654321",
          qualifications: "EN, Palliative Care",
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
      careNotes: "One resident is a fall risk and needs 30-minute checks overnight.",
    },
  });

  console.log("Seeded facility, admin, nurses (one verified, one pending), and a demo shift.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
