import { createContext } from "react";

export type NoticeKind = "success" | "error";
export const NoticeContext = createContext<(message: string, kind?: NoticeKind) => void>(() => undefined);
