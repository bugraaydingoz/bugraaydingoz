import { migrateDatabase } from "./migrations";

await migrateDatabase();
console.log("RoboFleet database migrations applied");
