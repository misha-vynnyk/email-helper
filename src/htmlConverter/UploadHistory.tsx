import { useState, useEffect } from "react";
import { History as HistoryIcon, Copy as CopyIcon, Link as LinkIcon, CheckCircle as CheckIcon, ChevronDown as ExpandMoreIcon, ChevronUp as ExpandLessIcon, Trash2 as DeleteIcon, Folder as FolderIcon, Clock as TimeIcon, Image as ImageIcon, FileText as AltIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { copyToClipboard } from "./utils/clipboard";
import { UI_TIMINGS, UPLOAD_CONFIG } from "./constants";
import { formatTimeRelative } from "./utils/formatters";
import type { UploadSession } from "./types";

interface UploadHistoryProps {
  sessions: UploadSession[];
  onClear: () => void;
}

export default function UploadHistory({ sessions, onClear }: UploadHistoryProps) {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination calculations
  const totalPages = Math.ceil(sessions.length / UPLOAD_CONFIG.SESSIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * UPLOAD_CONFIG.SESSIONS_PER_PAGE;
  const endIndex = startIndex + UPLOAD_CONFIG.SESSIONS_PER_PAGE;
  const paginatedSessions = sessions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    // Reset expanded sessions when changing page
    setExpandedSessions(new Set());
  };

  // Reset to page 1 when sessions list changes (new upload or clear)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [sessions.length, currentPage, totalPages]);

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const handleCopy = async (text: string, key: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedUrl(key);
      setTimeout(() => setCopiedUrl(null), UI_TIMINGS.COPIED_FEEDBACK);
    }
  };

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className='bg-card rounded-2xl p-6 border border-border/50 shadow-soft hover:shadow-md transition-all duration-300'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <HistoryIcon className='text-primary' size={20} />
          <h2 className='text-lg font-semibold text-foreground'>Upload History</h2>
          <span className='px-2 py-0.5 bg-primary/10 text-primary font-semibold text-xs rounded-full'>{sessions.reduce((sum, s) => sum + s.files.length, 0)}</span>
        </div>
        <button onClick={onClear} className='flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-all hover:scale-105 active:scale-95'>
          <DeleteIcon size={16} />
          Clear All
        </button>
      </div>

      {/* Sessions List */}
      <div className='flex flex-col gap-3'>
        {paginatedSessions.map((session) => {
          const isExpanded = expandedSessions.has(session.id);
          const successCount = session.files.filter((f) => f.url).length;

          return (
            <div key={session.id} className='border border-border/50 rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-md group/session'>
              {/* Session Header */}
              <div onClick={() => toggleSession(session.id)} className='p-4 flex items-center justify-between cursor-pointer bg-muted/30 hover:bg-primary/5 transition-colors'>
                <div className='flex items-center gap-3 flex-1'>
                  <FolderIcon className='text-primary' size={20} />
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span className='text-sm font-semibold text-foreground'>{session.folderName}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${session.category === "finance" ? "bg-success/10 text-success" : "bg-info/10 text-info"}`}>{session.category}</span>
                    </div>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      <span className='flex items-center gap-1'>
                        <TimeIcon size={12} />
                        {formatTimeRelative(session.timestamp)}
                      </span>
                      <span>•</span>
                      <span>
                        {successCount} file{successCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <button className='p-1 text-muted-foreground hover:bg-muted rounded-full transition-colors'>{isExpanded ? <ExpandLessIcon size={20} /> : <ExpandMoreIcon size={20} />}</button>
              </div>

              {/* Session Files */}
              {isExpanded && (
                <div className='p-4 pt-3 bg-background border-t border-border/50'>
                  <div className='flex flex-col gap-2'>
                    {session.files.map((file) => (
                      <div key={file.id} className='p-3 rounded-lg bg-muted/30 hover:bg-primary/5 flex items-center gap-3 transition-all duration-200 border border-transparent hover:border-primary/20 hover:shadow-sm'>
                        <ImageIcon className='text-muted-foreground w-4 h-4 shrink-0' />

                        <div className='flex-1 min-w-0'>
                          <div className='text-sm font-medium text-foreground mb-1 truncate'>{file.filename}</div>
                          <div className='text-xs font-mono text-muted-foreground truncate'>{file.shortPath}</div>
                          {file.alt && (
                            <div className='flex items-center gap-1.5 mt-1.5 text-xs text-info'>
                              <AltIcon size={14} />
                              <span className='font-semibold'>ALT:</span>
                              <span className='truncate'>{file.alt}</span>
                            </div>
                          )}
                        </div>

                        <div className='flex items-center gap-1 shrink-0'>
                          <button title='Copy full URL' onClick={() => handleCopy(file.url, `${file.id}-url`)} className={`p-1.5 rounded-md transition-all hover:scale-110 active:scale-95 ${copiedUrl === `${file.id}-url` ? "text-success bg-success/10" : "text-primary hover:bg-primary/10"}`}>
                            {copiedUrl === `${file.id}-url` ? <CheckIcon size={16} /> : <LinkIcon size={16} />}
                          </button>

                          <button title='Copy short path' onClick={() => handleCopy(file.shortPath, `${file.id}-path`)} className={`p-1.5 rounded-md transition-all hover:scale-110 active:scale-95 ${copiedUrl === `${file.id}-path` ? "text-success bg-success/10" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                            {copiedUrl === `${file.id}-path` ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                          </button>

                          {file.alt && (
                            <button title='Copy ALT text' onClick={() => handleCopy(file.alt!, `${file.id}-alt`)} className={`p-1.5 rounded-md transition-all hover:scale-110 active:scale-95 ${copiedUrl === `${file.id}-alt` ? "text-success bg-success/10" : "text-info hover:bg-info/10"}`}>
                              {copiedUrl === `${file.id}-alt` ? <CheckIcon size={16} /> : <AltIcon size={16} />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex justify-center items-center mt-6 pt-4 border-t border-border/50 gap-2'>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className='p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors'>
            <ChevronLeft size={20} />
          </button>

          <div className='flex items-center gap-1'>
            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              const isSelected = currentPage === page;
              return (
                <button key={page} onClick={() => handlePageChange(page)} className={`min-w-[32px] h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${isSelected ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  {page}
                </button>
              );
            })}
          </div>

          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className='p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors'>
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
