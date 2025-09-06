const base = `http://localhost:${process.env.PORT || 5000}`;

async function main() {
  const res1 = await fetch(`${base}/api/health/db`);
  console.log("Health DB:", await res1.json());

  const res2 = await fetch(`${base}/public/companies`);
  console.log("Companies:", await res2.json());

  const res3 = await fetch(`${base}/public/projects`);
  console.log("Projects:", await res3.json());
}

main().catch(console.error);
