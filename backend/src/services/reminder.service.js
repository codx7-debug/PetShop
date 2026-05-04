import {
  listAppointmentsForReminder,
  markReminderSent,
  logReminder,
} from "./appointment.service.js";

function formatLocalStart(startsAt, timeZone) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timeZone || "UTC",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(startsAt));
  } catch {
    return String(startsAt);
  }
}

/**
 * Resolves outbound channel: appointment.reminder_channel overrides pet preference.
 * `auto`: WhatsApp when Twilio WhatsApp is configured, user opted in, and phone present;
 * otherwise SMS when Twilio SMS works; otherwise `none` (logged only).
 */
export function resolveOutboundChannel(row) {
  const apptPref = (row.reminder_channel || "auto").toLowerCase();
  const petPref = (row.reminder_preference || "auto").toLowerCase();
  const hasPhone = Boolean(row.owner_phone && String(row.owner_phone).trim());
  const twilioOk = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  const waFrom = process.env.TWILIO_WHATSAPP_FROM?.trim();
  const canWa = Boolean(twilioOk && waFrom && row.whatsapp_opt_in && hasPhone);

  if (apptPref === "whatsapp") {
    return canWa ? "whatsapp" : hasPhone && twilioOk ? "sms" : "none";
  }
  if (apptPref === "sms") {
    return hasPhone && twilioOk ? "sms" : "none";
  }

  if (petPref === "whatsapp") {
    return canWa ? "whatsapp" : hasPhone && twilioOk ? "sms" : "none";
  }
  if (petPref === "sms") {
    return hasPhone && twilioOk ? "sms" : "none";
  }

  // auto: prefer WhatsApp when cost-effective setup exists (single Twilio bill, WA often lower per msg)
  if (canWa) return "whatsapp";
  if (hasPhone && twilioOk) return "sms";
  return "none";
}

function buildBody(row, kind) {
  const pet = row.pet_name || "your pet";
  const when = formatLocalStart(row.starts_at, row.display_timezone);
  const lead = kind === "24h" ? "24-hour reminder" : "2-hour reminder";
  return `${lead}: Veterinary appointment for ${pet} at ${when}. Reply if you need to reschedule.`;
}

async function sendTwilioMessage({ channel, to, body }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const smsFrom = process.env.TWILIO_PHONE_NUMBER;
  const waFrom = process.env.TWILIO_WHATSAPP_FROM;
  if (!accountSid || !authToken) return { ok: false, status: "twilio_not_configured" };

  const twilio = (await import("twilio")).default;
  const client = twilio(accountSid, authToken);

  if (channel === "whatsapp") {
    if (!waFrom) return { ok: false, status: "missing_TWILIO_WHATSAPP_FROM" };
    const waTo = `whatsapp:${String(to).replace(/^whatsapp:/, "")}`;
    const from = waFrom.startsWith("whatsapp:") ? waFrom : `whatsapp:${waFrom}`;
    const msg = await client.messages.create({ from, to: waTo, body });
    return { ok: true, status: msg.status, sid: msg.sid };
  }

  if (channel === "sms") {
    if (!smsFrom) return { ok: false, status: "missing_TWILIO_PHONE_NUMBER" };
    const msg = await client.messages.create({ from: smsFrom, to, body });
    return { ok: true, status: msg.status, sid: msg.sid };
  }

  return { ok: false, status: "unsupported_channel" };
}

async function dispatchOne(row, kind) {
  const channel = resolveOutboundChannel(row);
  const body = buildBody(row, kind);
  const to = row.owner_phone?.trim() || "";

  if (channel === "none" || !to) {
    await logReminder({
      appointmentId: row.id,
      channel: "skipped",
      kind,
      toAddress: to || null,
      body,
      providerStatus: channel === "none" ? "no_channel_or_phone" : "missing_phone",
    });
    await markReminderSent(row.id, kind);
    return;
  }

  try {
    const result = await sendTwilioMessage({
      channel,
      to: channel === "whatsapp" ? to : to,
      body,
    });
    await logReminder({
      appointmentId: row.id,
      channel,
      kind,
      toAddress: to,
      body,
      providerStatus: result.status || (result.ok ? "sent" : "failed"),
    });
    if (result.ok) await markReminderSent(row.id, kind);
  } catch (e) {
    console.error("[reminder]", row.id, e);
    await logReminder({
      appointmentId: row.id,
      channel,
      kind,
      toAddress: to,
      body,
      providerStatus: e.message?.slice(0, 80) || "error",
    });
  }
}

export async function processRemindersForKind(kind) {
  const rows = await listAppointmentsForReminder(kind);
  for (const row of rows) {
    await dispatchOne(row, kind);
  }
  return rows.length;
}

export async function processReminders() {
  const n24 = await processRemindersForKind("24h");
  const n2 = await processRemindersForKind("2h");
  if (n24 + n2 > 0) console.log(`[reminder cron] dispatched window checks: 24h=${n24}, 2h=${n2}`);
}
