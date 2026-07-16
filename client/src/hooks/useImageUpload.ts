import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { mockResult, type ActionResult } from "@/lib/mockData";
import { trpc, type ExtractionListItem } from "@/lib/trpc";

const API_URL = "/api/extract";

export function useImageUpload() {
  const utils = trpc.useUtils();
  const toggleTaskMutation = trpc.extractions.toggleTask.useMutation({
    onSuccess: () => utils.extractions.list.invalidate(),
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<ActionResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [usedMockData, setUsedMockData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selectedFile: File) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(selectedFile.type)) return;

    setFile(selectedFile);
    setResults(null);
    setUsedMockData(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) handleFile(selectedFile);
    },
    [handleFile]
  );

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const extractActions = useCallback(async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setResults(null);
    setUsedMockData(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      // Map backend response to ActionResult format
      const mappedResult: ActionResult = {
        id: data.id ?? null,
        summary: data.summary || `Extracted ${data.tasks.length} tasks`,
        extractedText: data.extracted_text || "",
        tasks: (data.tasks || []).map((t: any) => ({
          id: t.id ?? null,
          text: t.title,
          priority: t.priority,
          completed: t.completed ?? false,
        })),
        dates: (data.calendar_events || []).map((e: any) => ({
          label: e.title,
          date: e.date
        })),
        reminders: (data.reminders || []).map((r: any) => ({
          text: r.text || r,
          time: r.time || ""
        })),
        calendarEvents: (data.calendar_events || []).map((e: any) => ({
          title: e.title,
          date: e.date,
          time: e.time || "All day",
          duration: e.duration || "—"
        })),
      };

      setResults(mappedResult);
      utils.extractions.list.invalidate();
    } catch {
      // Backend unreachable — show demo results after a brief simulated delay
      await new Promise((resolve) => setTimeout(resolve, 2200));
      setUsedMockData(true);
      setResults(mockResult);
      toast.info("Backend not connected — showing demo results", {
        description:
          "The backend server is currently unreachable. Please ensure it is running.",
        duration: 5000,
      });
    }

    setIsAnalyzing(false);
  }, [file]);

  const viewExtraction = useCallback((extraction: ExtractionListItem) => {
    setFile(null);
    setPreview(null);
    setUsedMockData(false);
    setResults({
      id: extraction.id,
      summary: extraction.summary,
      extractedText: extraction.extractedText,
      tasks: extraction.tasks.map(t => ({
        id: t.id,
        text: t.text,
        priority: t.priority,
        completed: t.completed,
      })),
      dates: extraction.calendarEvents.map(e => ({ label: e.title, date: e.date })),
      reminders: extraction.reminders,
      calendarEvents: extraction.calendarEvents,
    });
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    setResults(null);
    setUsedMockData(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const toggleTask = useCallback(
    (index: number) => {
      setResults(prev => {
        if (!prev) return prev;
        const task = prev.tasks[index];
        if (!task) return prev;

        const completed = !task.completed;
        if (task.id != null) {
          toggleTaskMutation.mutate({ taskId: task.id, completed });
        }

        return {
          ...prev,
          tasks: prev.tasks.map((t, i) => (i === index ? { ...t, completed } : t)),
        };
      });
    },
    [toggleTaskMutation]
  );

  return {
    file,
    preview,
    isAnalyzing,
    results,
    isDragOver,
    usedMockData,
    fileInputRef,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleInputChange,
    triggerFileInput,
    extractActions,
    clearFile,
    toggleTask,
    viewExtraction,
  };
}
