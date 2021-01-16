interface BlueprintChild {
  type: "blueprint";
  id: string;
  name: string;
}

interface BlueprintBookChild {
  type: "blueprint_book";
  id: string;
  name: string;
  children: ChildTree;
}

export type ChildTree = Array<BlueprintChild | BlueprintBookChild>;

export interface Blueprint {
  id: string;
  label: string; // from source
  description: string | null; // from source
  game_version: string | null; // from source
  blueprint_hash: string;
  image_hash: string;
  created_at: number;
  updated_at: number;
  tags: string[];
  factorioprints_id: string | null;
  // BlueprintEntry->BlueprintString 1:m
  // BlueprintEntry->BlueprintPageEntry n:m
}

export interface BlueprintBook {
  id: string;
  label: string;
  description?: string;
  child_tree: ChildTree;
  blueprint_hash: string;
  created_at: number;
  updated_at: number;
  is_modded: boolean;
  factorioprints_id?: string;
  // BlueprintBook:BlueprintBook n:m
  // BlueprintBook:BlueprintEntry 1:m
}

/**
 * Blueprint page data object for app use
 * must be JSON serializable
 */
export interface BlueprintPage {
  id: string;
  blueprint_id: string | null;
  blueprint_book_id: string | null;
  title: string;
  description_markdown: string;
  created_at: number;
  updated_at: number;
  factorioprints_id: string | null;
  // BlueprintPageEntry->BlueprintEntry 1:m
  // BlueprintPageEntry->BlueprintBook 1:m
}

export interface BlueprintString {
  blueprint_id: string;
  blueprint_hash: string;
  image_hash: string;
  version: number;
  changes_markdown: string;
  created_at: Date;
  // BlueprintString->BlueprintEntry m:1
}
