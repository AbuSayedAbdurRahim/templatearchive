import { notFound } from "next/navigation";
import { getTemplate, listCategories } from "@/lib/data";
import { TemplateForm } from "@/components/TemplateForm";

export default async function EditTemplate({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const t = /^[0-9a-f-]{36}$/i.test(id) ? await getTemplate(id) : null;
  if (!t) notFound();
  const tags = (t.template_tags ?? []).map((x) => x.tags?.name).filter(Boolean).join(", ");
  return (<><h1>Edit template</h1><TemplateForm t={t} tags={tags} categories={await listCategories()} error={sp.error} /></>);
}
