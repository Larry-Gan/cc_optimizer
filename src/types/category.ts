export interface CategoryNode {
  id: string;
  label: string;
  parentId: string | null;
  children: CategoryNode[];
  networkRestrictions?: string[];
}

export interface CategoryOption {
  id: string;
  label: string;
  depth: number;
  parentId: string | null;
}
