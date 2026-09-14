function formatIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

type IcsEvent = {
  uid: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  location: string;
  description: string;
};

function buildVEvent(event: IcsEvent) {
  return [
    "BEGIN:VEVENT",
    `UID:${event.uid}@shiftready.local`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(event.startsAt)}`,
    `DTEND:${formatIcsDate(event.endsAt)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    "END:VEVENT",
  ].join("\r\n");
}

export function buildShiftInviteIcs(event: IcsEvent) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ShiftReady//Shift Invite//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    buildVEvent(event),
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export function buildScheduleIcs(events: IcsEvent[]) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ShiftReady//Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events.map(buildVEvent),
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
