export type Status = "draft" | "published" | "archived";
export type Format = "text" | "markdown" | "code";

export interface Category { id: string; name: string; position: number }
export interface Tag { id: string; name: string }

export interface Template {
  id: string;
  title: string;
  content: string;
  description: string | null;
  usage_instructions: string | null;
  source_url: string | null;
  format: Format;
  status: Status;
  category_id: string | null;
  is_favorite: boolean;
  is_pinned: boolean;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  categories?: { name: string } | null;
  template_tags?: { tags: Tag | null }[];
}

export type SectionId = "pinned" | "favorites" | "recent_used" | "recent_added" | "recent_updated" | "categories" | "stats";
export type SortKey = "title" | "created" | "updated" | "used";

export interface DashboardSettings {
  siteName: string;
  welcomeHeading: string;
  welcomeText: string;
  sections: { id: SectionId; visible: boolean }[];
  defaultSort: SortKey;
  defaultLanding: "dashboard" | "templates";
}
