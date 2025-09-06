import { prisma } from "../src/db.js";

async function main() {
  const companies = await prisma.company.findMany({
    include: { users: true, projects: true }
  });
  const projects = await prisma.project.findMany({
    include: { company: true, memberLinks: true }
  });
  console.log("Companies:", JSON.stringify(companies, null, 2));
  console.log("Projects:", JSON.stringify(projects, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Inspect ERROR:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
