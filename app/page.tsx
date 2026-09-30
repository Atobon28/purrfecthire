import { EvaluationWorkspace } from "@/components/evaluation-workspace";
import { RecordManager } from "@/components/record-manager";

export default function HomePage() {
  return (
    <>
      <EvaluationWorkspace />
      <RecordManager />
    </>
  );
}
