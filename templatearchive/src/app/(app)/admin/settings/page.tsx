import { getSettings } from "@/lib/data";
import { resetSettings, saveSettings } from "@/lib/actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Notice } from "@/components/Notice";

const LABELS: Record<string, string> = {
  pinned: "Pinned", favorites: "Favorites", recent_used: "Recently used", recent_added: "Recently added",
  recent_updated: "Recently updated", categories: "Categories", stats: "Archive statistics",
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const s = await getSettings();
  return (
    <>
      <Notice sp={sp} />
      <h1>Dashboard settings</h1>
      <form action={saveSettings} className="stack">
        <label>Site name<input name="siteName" defaultValue={s.siteName} required maxLength={60} /></label>
        <label>Welcome heading<input name="welcomeHeading" defaultValue={s.welcomeHeading} maxLength={120} /></label>
        <label>Welcome text<input name="welcomeText" defaultValue={s.welcomeText} maxLength={300} /></label>
        <fieldset>
          <legend>Sections (lower number appears first)</legend>
          {s.sections.map((sec, i) => (
            <div className="row" key={sec.id}>
              <label className="check"><input type="checkbox" name={`show_${sec.id}`} defaultChecked={sec.visible} />{LABELS[sec.id]}</label>
              <label>Position<input type="number" name={`pos_${sec.id}`} defaultValue={i + 1} min={1} max={20} /></label>
            </div>
          ))}
        </fieldset>
        <div className="row">
          <label>Default sort<select name="defaultSort" defaultValue={s.defaultSort}><option value="updated">Last updated</option><option value="created">Date created</option><option value="title">Title</option><option value="used">Recently used</option></select></label>
          <label>Landing page<select name="defaultLanding" defaultValue={s.defaultLanding}><option value="dashboard">Dashboard</option><option value="templates">Template list</option></select></label>
        </div>
        <div className="toolbar"><button className="btn primary" type="submit">Save settings</button></div>
      </form>
      <form action={resetSettings}><ConfirmButton message="Reset dashboard settings to the defaults?">Reset to defaults</ConfirmButton></form>
    </>
  );
}
