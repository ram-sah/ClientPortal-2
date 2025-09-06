import { prisma } from "../src/db.js";

async function main() {
  const company = await prisma.company.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: { id: "00000000-0000-0000-0000-000000000001", name: "Conveyor MG" },
  });

  const user = await prisma.user.upsert({
    where: { email: "admin@conveyormg.com" },
    update: {},
    create: { email: "admin@conveyormg.com", name: "Admin User", companyId: company.id },
  });

  const project = await prisma.project.upsert({
    where: { id: "00000000-0000-0000-0000-000000000101" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000101",
      name: "Softbank Onboarding",
      companyId: company.id,
    },
  });

  await prisma.projectUser.upsert({
    where: { userId_projectId: { userId: user.id, projectId: project.id } },
    update: {},
    create: { userId: user.id, projectId: project.id },
  });

  console.log("Seed OK:", { company, user, project });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Seed ERROR:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
