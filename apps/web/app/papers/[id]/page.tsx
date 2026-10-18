import { notFound } from "next/navigation";
import { getPaper, listFields, paperLabel } from "@/lib/data";
import { EvidenceWorkspace } from "./evidence-workspace";

export const dynamic = "force-dynamic";

export default async function PaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paper = await getPaper(id);
  if (!paper) notFound();
  const fields = await listFields(paper.id);

  return (
    <>
      <h1>{paperLabel(paper)}</h1>
      <EvidenceWorkspace paperId={paper.id} fields={fields} />
    </>
  );
}
