import { useContext } from "react";
import { NoticeContext } from "@/components/shared/NoticeContext";

export function useNotice() {
  return useContext(NoticeContext);
}
