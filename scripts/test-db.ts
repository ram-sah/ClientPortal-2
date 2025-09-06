import { Client } from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

(async () => {
  const client = new Client({
    connectionString: url,
    ssl: {
      rejectUnauthorized: false,    // ignore self-signed cert
      require: true                 // enforce SSL
    }
  });
  await client.connect();
  const r = await client.query("select now() as now");
  console.log("DB OK:", r.rows[0].now);
  await client.end();
})().catch(e => {
  console.error("DB ERROR:", e.message);
  process.exit(1);
});
