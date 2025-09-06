import { Client } from "pg";
const url = process.env.DIRECT_URL;
if (!url) { console.error("Missing DIRECT_URL"); process.exit(1); }
(async () => {
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false } // direct also needs SSL in Replit
  });
  await client.connect();
  const r = await client.query("select now() as now");
  console.log("DIRECT DB OK:", r.rows[0].now);
  await client.end();
})().catch(e => { console.error("DIRECT DB ERROR:", e.message); process.exit(1); });
