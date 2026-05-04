import cron from "node-cron";
import { processReminders } from "../services/reminder.service.js";

let started = false;

export function startReminderCron() {
  if (started) return;
  started = true;
  if (process.env.REMINDER_CRON_DISABLED === "1") {
    console.log("[reminder cron] disabled via REMINDER_CRON_DISABLED");
    return;
  }
  cron.schedule("*/5 * * * *", async () => {
    try {
      await processReminders();
    } catch (e) {
      console.error("[reminder cron]", e);
    }
  });
  console.log("[reminder cron] scheduled every 5 minutes");
}
