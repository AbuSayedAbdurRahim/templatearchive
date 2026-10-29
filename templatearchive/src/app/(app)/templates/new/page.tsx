import { listCategories } from "@/lib/data";
import { TemplateForm } from "@/components/TemplateForm";

export default async function NewTemplate({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (<><h1>New template</h1><TemplateForm categories={await listCategories()} error={sp.error} /></>);
}
