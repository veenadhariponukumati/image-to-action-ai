export interface ActionResult {
  id?: number | null;
  extractedText: string;
  tasks: { id?: number | null; text: string; priority: "high" | "medium" | "low"; completed: boolean }[];
  dates: { label: string; date: string }[];
  reminders: { text: string; time: string }[];
  calendarEvents: { title: string; date: string; time: string; duration: string }[];
  summary: string;
}

export const mockResult: ActionResult = {
  extractedText:
    "Q3 Planning Meeting Notes\n\n1. Launch new landing page — deadline July 15\n2. Schedule user interviews for next week\n3. Review analytics dashboard by Friday\n4. Team standup moved to 9:30 AM daily\n5. Budget review meeting with finance — July 20\n6. Send onboarding docs to new hires by EOD Thursday",

  tasks: [
    { text: "Launch new landing page", priority: "high", completed: false },
    { text: "Schedule user interviews for next week", priority: "high", completed: false },
    { text: "Review analytics dashboard", priority: "medium", completed: false },
    { text: "Send onboarding docs to new hires", priority: "medium", completed: false },
    { text: "Prepare budget review materials", priority: "low", completed: false },
  ],

  dates: [
    { label: "Landing page launch deadline", date: "July 15, 2026" },
    { label: "Budget review meeting", date: "July 20, 2026" },
    { label: "Analytics dashboard review", date: "This Friday" },
    { label: "Onboarding docs due", date: "This Thursday EOD" },
  ],

  reminders: [
    { text: "Schedule user interviews", time: "Tomorrow, 9:00 AM" },
    { text: "Send onboarding docs to new hires", time: "Thursday, 5:00 PM" },
    { text: "Review analytics dashboard", time: "Friday, 10:00 AM" },
  ],

  calendarEvents: [
    {
      title: "Daily Team Standup",
      date: "Recurring weekdays",
      time: "9:30 AM",
      duration: "15 min",
    },
    {
      title: "Budget Review with Finance",
      date: "July 20, 2026",
      time: "2:00 PM",
      duration: "1 hour",
    },
    {
      title: "Landing Page Launch",
      date: "July 15, 2026",
      time: "All day",
      duration: "—",
    },
  ],

  summary:
    "This image contains Q3 planning meeting notes with 5 action items, 4 key dates, and 3 calendar events. The highest priority items are the landing page launch (July 15) and scheduling user interviews. A recurring daily standup has been moved to 9:30 AM.",
};
