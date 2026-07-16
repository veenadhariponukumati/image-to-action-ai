import { Router, Request, Response } from "express";
import { invokeLLM } from "./_core/llm";
import { saveExtraction } from "./db";
import { getSessionUser } from "./_core/session";
import multer, { FileFilterCallback } from "multer";
import { rateLimit } from "express-rate-limit";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PNG, JPG, JPEG, and WebP images are allowed"));
    }
  },
});

// Every request here hits a billed OpenAI vision call with no auth in front of it —
// cap per-IP volume so a runaway client (or refresh-mashing) can't rack up cost.
const extractLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many extraction requests. Please try again later." },
});

const SYSTEM_PROMPT = `You are an AI assistant that analyzes images of screenshots, handwritten notes, whiteboards, and planning boards. Your job is to extract structured action items from the image.

Analyze the image and return a JSON object with the following structure:
{
  "summary": "A brief 1-2 sentence summary of what the image contains and what was extracted",
  "extracted_text": "The raw text content visible in the image, transcribed as accurately as possible",
  "tasks": [
    {
      "title": "A clear, actionable task description",
      "priority": "high" | "medium" | "low"
    }
  ],
  "calendar_events": [
    {
      "title": "Event name",
      "date": "The date mentioned (e.g., 'July 15, 2026' or 'Next Monday')"
    }
  ],
  "reminders": ["Short reminder text strings"]
}

Guidelines:
- Extract ALL actionable items, even if implicit
- Assign priority based on urgency indicators (deadlines, emphasis, order)
- Include any dates or time references as calendar_events
- Include time-sensitive items as reminders
- If no items exist for a category, return an empty array
- Always return valid JSON`;

async function requireAuth(req: Request, res: Response, next: () => void) {
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Please sign in to extract actions from an image" });
    return;
  }
  (req as any).user = user;
  next();
}

export function registerExtractRoute(app: Router) {
  app.post("/api/extract", extractLimiter, requireAuth, upload.single("file"), async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      // Convert the uploaded image to a base64 data URL for the LLM
      const base64 = file.buffer.toString("base64");
      const dataUrl = `data:${file.mimetype};base64,${base64}`;

      // Call the LLM with the image
      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: dataUrl,
                  detail: "high",
                },
              },
              {
                type: "text",
                text: "Analyze this image and extract all action items, tasks, dates, reminders, and calendar events. Return the result as JSON.",
              },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "extract_actions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summary: { type: "string", description: "Brief summary of what was extracted" },
                extracted_text: { type: "string", description: "Raw text transcribed from the image" },
                tasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Task description" },
                      priority: { type: "string", enum: ["high", "medium", "low"], description: "Task priority" },
                    },
                    required: ["title", "priority"],
                    additionalProperties: false,
                  },
                },
                calendar_events: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Event title" },
                      date: { type: "string", description: "Event date (e.g., 'July 15, 2026' or 'Next Monday')" },
                      time: { type: "string", description: "Event time (e.g., '2:00 PM' or 'All day')" },
                      duration: { type: "string", description: "Event duration (e.g., '1 hour', '30 min', or '—' for all-day)" },
                    },
                    required: ["title", "date", "time", "duration"],
                    additionalProperties: false,
                  },
                },
                reminders: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      text: { type: "string", description: "Reminder text" },
                      time: { type: "string", description: "When the reminder should trigger (e.g., 'Tomorrow 9:00 AM', 'Friday 5:00 PM')" },
                    },
                    required: ["text", "time"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["summary", "extracted_text", "tasks", "calendar_events", "reminders"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = result.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        res.status(500).json({ error: "AI returned an empty response" });
        return;
      }

      // Parse the JSON response from the LLM
      const parsed = JSON.parse(content);

      const saved = await saveExtraction(user.id, {
        summary: parsed.summary ?? "",
        extractedText: parsed.extracted_text ?? "",
        reminders: (parsed.reminders ?? []).map((r: any) =>
          typeof r === "string" ? { text: r, time: "" } : { text: r.text, time: r.time ?? "" }
        ),
        calendarEvents: parsed.calendar_events ?? [],
        tasks: (parsed.tasks ?? []).map((t: any) => ({ text: t.title, priority: t.priority })),
      });

      res.json({
        ...parsed,
        id: saved.id,
        tasks: saved.tasks.map(t => ({ id: t.id, title: t.text, priority: t.priority, completed: t.completed })),
      });
    } catch (error: any) {
      console.error("[Extract] Error:", error?.message || error);
      res.status(500).json({
        error: "Failed to analyze image",
        details: error?.message || "Unknown error",
      });
    }
  });
}
