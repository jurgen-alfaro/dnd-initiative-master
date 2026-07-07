import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

config({ path: ".env" });

const runMigrate = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("⏳ Starting migration...");

  const start = Date.now();

  try {
    // This applies every pending change in the ./drizzle folder
    await migrate(db, { migrationsFolder: "drizzle" });

    const end = Date.now();
    console.log(`✅ Migration completed successfully in ${end - start}ms`);
  } catch (err) {
    console.error("❌ Error during migration:", err);
    process.exit(1);
  }
};

runMigrate();
