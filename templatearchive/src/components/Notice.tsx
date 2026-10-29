export function Notice({ sp }: { sp: Record<string, string | undefined> }) {
  if (sp.error) return <p className="notice error" role="alert">{sp.error}</p>;
  if (sp.saved) return <p className="notice ok" role="status">{sp.saved === "1" ? "Saved" : sp.saved}</p>;
  if (sp.preview) return <p className="notice ok" role="status">Preview: {sp.preview}. Nothing was changed.</p>;
  return null;
}
