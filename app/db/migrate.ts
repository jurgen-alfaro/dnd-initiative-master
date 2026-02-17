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

  console.log("⏳ Iniciando migración...");

  const start = Date.now();

  try {
    // Esto aplicará todos los cambios pendientes en la carpeta ./drizzle
    await migrate(db, { migrationsFolder: "drizzle" });

    const end = Date.now();
    console.log(`✅ Migración completada exitosamente en ${end - start}ms`);
  } catch (err) {
    console.error("❌ Error durante la migración:", err);
    process.exit(1);
  }
};

runMigrate();
