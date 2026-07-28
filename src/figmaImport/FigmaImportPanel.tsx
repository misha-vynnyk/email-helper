import React from "react";

import { Input } from "../components/ui/input";
import { useFigmaImportFolder } from "./useFigmaImportFolder";

const OPEN_QUESTION_MARKER = "OPEN QUESTION for confirmation before build:";

function extractOpenQuestions(description?: string): string[] {
  if (!description) return [];
  return description
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.includes(OPEN_QUESTION_MARKER));
}

function countTopLevelNodes(raw?: string): number {
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export default function FigmaImportPanel() {
  const [folderPath, setFolderPath] = React.useState("");
  const { loading, error, description, descriptionExists, desktopRaw, mobileRaw, validation, load } =
    useFigmaImportFolder();

  const handleLoad = () => {
    if (folderPath.trim()) {
      load(folderPath.trim());
    }
  };

  const openQuestions = extractOpenQuestions(description);

  return (
    <div className='mx-auto flex max-w-3xl flex-col gap-4 p-6'>
      <div>
        <h2 className='text-lg font-bold'>Figma Import — Етап 1</h2>
        <p className='text-sm text-muted-foreground'>Читання + валідація опису/JSON пари, без асемблера.</p>
      </div>

      <div className='flex gap-2'>
        <Input
          value={folderPath}
          onChange={(e) => setFolderPath(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLoad()}
          placeholder='/шлях/до/папки/з/темплейтом'
        />
        <button
          onClick={handleLoad}
          disabled={loading || !folderPath.trim()}
          className='flex-shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-50'>
          {loading ? "Завантаження..." : "Load"}
        </button>
      </div>

      {error && (
        <div className='rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
          {error}
        </div>
      )}

      {validation && validation.valid && (
        <div className='flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary'>
          <div className='font-bold'>Валідація пройшла успішно</div>
          <div>Desktop: {countTopLevelNodes(desktopRaw)} топ-левел вузлів</div>
          <div>Mobile: {countTopLevelNodes(mobileRaw)} топ-левел вузлів</div>
          {openQuestions.length > 0 && (
            <div className='mt-1'>
              <div className='font-bold'>Відкриті питання:</div>
              <ul className='list-disc pl-5'>
                {openQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {validation && !validation.valid && (
        <div className='flex flex-col gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
          <div className='font-bold'>Помилки валідації ({validation.errors.length})</div>
          <ul className='list-disc pl-5 font-mono text-xs'>
            {validation.errors.map((e, i) => (
              <li key={i}>
                {e.file}.json — {e.path}: {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {descriptionExists && description && (
        <div className='rounded-xl border border-border bg-card p-4'>
          <div className='mb-2 text-sm font-bold'>description.md</div>
          <pre className='max-h-96 overflow-auto whitespace-pre-wrap text-xs text-foreground'>{description}</pre>
        </div>
      )}
    </div>
  );
}
