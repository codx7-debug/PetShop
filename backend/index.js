import "dotenv/config";
import app from "./src/app.js";
import { initAppointmentSchema } from "./src/services/schemaInit.service.js";
import { initUserSchema } from "./src/services/userSchema.service.js";
import { initCoreSchema } from "./src/services/schemaCore.service.js";
import { initFacilitySchema } from "./src/services/facilitySchema.service.js";
import { initOrgAccountingSchema } from "./src/services/orgAccounting.schema.service.js";
import { initOrgReportingSchema } from "./src/services/orgReporting.schema.service.js";
import { startReminderCron } from "./src/jobs/reminderCron.js";

const PORT = Number(process.env.PORT) || 3000;

await initUserSchema();
await initAppointmentSchema();
await initCoreSchema();
await initFacilitySchema();
await initOrgAccountingSchema();
await initOrgReportingSchema();
startReminderCron();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});