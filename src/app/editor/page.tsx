import { Suspense } from "react";
import GridEditor from "@/components/editor/GridEditor";

export default function EditorPage() {
  return (
    <Suspense>
      <GridEditor />
    </Suspense>
  );
}
