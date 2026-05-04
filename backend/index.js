import "dotenv/config";
import app from "./src/app.js";
import { initAppointmentSchema } from "./src/services/schemaInit.service.js";
import { initUserSchema } from "./src/services/userSchema.service.js";
import { initCoreSchema } from "./src/services/schemaCore.service.js";
import { startReminderCron } from "./src/jobs/reminderCron.js";

const PORT = Number(process.env.PORT) || 3000;

await initUserSchema();
await initAppointmentSchema();
await initCoreSchema();
startReminderCron();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});