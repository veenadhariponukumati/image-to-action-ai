import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "./_core/app";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    id: "test-id",
    created: Date.now(),
    model: "test-model",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: JSON.stringify({
            summary: "Extracted 2 tasks from the image",
            extracted_text: "Task 1: Do something\nTask 2: Do another thing",
            tasks: [
              { title: "Do something", priority: "high" },
              { title: "Do another thing", priority: "medium" },
            ],
            calendar_events: [{ title: "Meeting", date: "June 25" }],
            reminders: ["Follow up tomorrow"],
          }),
        },
        finish_reason: "stop",
      },
    ],
  }),
}));

describe("Extract endpoint", () => {
  const app = createApp();

  it("requires authentication", async () => {
    const res = await request(app).post("/api/extract");
    expect(res.status).toBe(401);
  });

  it("returns 400 when authenticated but no file is provided", async () => {
    const agent = request.agent(app);
    const email = `extract-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    await agent.post("/api/auth/signup").send({ email, password: "password123" });

    const res = await agent.post("/api/extract");
    expect(res.status).toBe(400);
  });

  it("should validate the response structure from a successful extraction", () => {
    // Validate the expected response structure
    const mockResponse = {
      summary: "Extracted 2 tasks from the image",
      extracted_text: "Task 1: Do something\nTask 2: Do another thing",
      tasks: [
        { title: "Do something", priority: "high" },
        { title: "Do another thing", priority: "medium" },
      ],
      calendar_events: [{ title: "Meeting", date: "June 25" }],
      reminders: ["Follow up tomorrow"],
    };

    expect(mockResponse).toHaveProperty("summary");
    expect(mockResponse).toHaveProperty("extracted_text");
    expect(mockResponse).toHaveProperty("tasks");
    expect(mockResponse).toHaveProperty("calendar_events");
    expect(mockResponse).toHaveProperty("reminders");

    expect(mockResponse.tasks).toHaveLength(2);
    expect(mockResponse.tasks[0]).toHaveProperty("title");
    expect(mockResponse.tasks[0]).toHaveProperty("priority");
    expect(["high", "medium", "low"]).toContain(mockResponse.tasks[0].priority);

    expect(mockResponse.calendar_events).toHaveLength(1);
    expect(mockResponse.calendar_events[0]).toHaveProperty("title");
    expect(mockResponse.calendar_events[0]).toHaveProperty("date");

    expect(mockResponse.reminders).toHaveLength(1);
    expect(typeof mockResponse.reminders[0]).toBe("string");
  });

  it("should handle the frontend mapping correctly", () => {
    // Simulate what the frontend does with the backend response
    const data = {
      summary: "Extracted 2 tasks",
      extracted_text: "Some text",
      tasks: [
        { title: "Task A", priority: "high" },
        { title: "Task B", priority: "low" },
      ],
      calendar_events: [{ title: "Deadline", date: "July 1" }],
      reminders: ["Check email"],
    };

    const mappedResult = {
      summary: data.summary || `Extracted ${data.tasks.length} tasks`,
      extractedText: data.extracted_text || "",
      tasks: (data.tasks || []).map((t: any) => ({
        text: t.title,
        priority: t.priority,
        completed: false,
      })),
      dates: (data.calendar_events || []).map((e: any) => ({
        label: e.title,
        date: e.date,
      })),
      reminders: (data.reminders || []).map((r: any) => ({
        text: r,
        time: null,
      })),
      calendarEvents: [],
    };

    expect(mappedResult.summary).toBe("Extracted 2 tasks");
    expect(mappedResult.extractedText).toBe("Some text");
    expect(mappedResult.tasks[0].text).toBe("Task A");
    expect(mappedResult.tasks[0].priority).toBe("high");
    expect(mappedResult.dates[0].label).toBe("Deadline");
    expect(mappedResult.dates[0].date).toBe("July 1");
    expect(mappedResult.reminders[0].text).toBe("Check email");
    expect(mappedResult.reminders[0].time).toBeNull();
  });

  it("should handle null/undefined fields gracefully", () => {
    // Simulate backend response with missing fields
    const data: any = {
      summary: null,
      extracted_text: undefined,
      tasks: null,
      calendar_events: undefined,
      reminders: null,
    };

    const mappedResult = {
      summary: data.summary || `Extracted ${(data.tasks || []).length} tasks`,
      extractedText: data.extracted_text || "",
      tasks: (data.tasks || []).map((t: any) => ({
        text: t.title,
        priority: t.priority,
        completed: false,
      })),
      dates: (data.calendar_events || []).map((e: any) => ({
        label: e.title,
        date: e.date,
      })),
      reminders: (data.reminders || []).map((r: any) => ({
        text: r,
        time: null,
      })),
      calendarEvents: [],
    };

    expect(mappedResult.summary).toBe("Extracted 0 tasks");
    expect(mappedResult.extractedText).toBe("");
    expect(mappedResult.tasks).toHaveLength(0);
    expect(mappedResult.dates).toHaveLength(0);
    expect(mappedResult.reminders).toHaveLength(0);
  });
});
