import { importData } from "@/lib/actions";
import { Notice } from "@/components/Notice";

export default async function DataPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <>
      <Notice sp={sp} />
      <h1>Export and import</h1>
      <h2>Export</h2>
      <p>Downloads every category, template and tag as one JSON file. Keep it somewhere private: it contains your whole archive.</p>
      <a className="btn primary" href="/api/export" download>Download JSON export</a>
      <h2>Import</h2>
      <p>Import adds templates that are not already here (matched by id). Existing templates are never overwritten. Choose a file, preview, then apply.</p>
      <form action={importData} className="stack">
        <label>JSON export file<input type="file" name="file" accept="application/json,.json" required /></label>
        <label className="check"><input type="checkbox" name="apply" value="yes" />Apply the import (leave unticked to preview only)</label>
        <button className="btn primary" type="submit">Preview or import</button>
      </form>
      <h2>Backups</h2>
      <p>Free Supabase projects have no automatic backups, so download an export regularly. CSV is not offered because it cannot reliably keep line breaks, tags and metadata.</p>
    </>
  );
}
