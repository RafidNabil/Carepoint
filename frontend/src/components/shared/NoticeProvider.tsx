import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NoticeContext, type NoticeKind } from "@/components/shared/NoticeContext";

type Notice = { id: number; message: string; kind: NoticeKind };

export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const notify = useCallback((message: string, kind: NoticeKind = "success") => {
    const id = Date.now() + Math.random();
    setNotices((existing) => [...existing, { id, message, kind }]);
    window.setTimeout(() => setNotices((existing) => existing.filter((notice) => notice.id !== id)), 4500);
  }, []);

  useEffect(() => {
    const onNotice = (event: Event) => {
      const custom = event as CustomEvent<{ message: string; kind?: NoticeKind }>;
      notify(custom.detail.message, custom.detail.kind);
    };
    window.addEventListener("clinic:notice", onNotice);
    return () => window.removeEventListener("clinic:notice", onNotice);
  }, [notify]);

  return (
    <NoticeContext.Provider value={notify}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {notices.map((notice) => (
          <div key={notice.id} className={cn("flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg", notice.kind === "success" ? "border-emerald-200" : "border-rose-200")}>
            {notice.kind === "success" ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-rose-600" />}
            <p className="flex-1 text-sm leading-5 text-slate-700">{notice.message}</p>
            <button aria-label="Dismiss notification" onClick={() => setNotices((existing) => existing.filter((item) => item.id !== notice.id))} className="text-slate-400 hover:text-slate-700"><X className="size-4" /></button>
          </div>
        ))}
      </div>
    </NoticeContext.Provider>
  );
}
