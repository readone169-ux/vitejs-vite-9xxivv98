// ─── Column Types ────────────────────────────────────────────────────────────
export type ColumnType =
  | 'Text'
  | 'Number'
  | 'DateTime'
  | 'Choice'
  | 'Boolean'
  | 'Person'
  | 'Lookup'
  | 'URL'
  | 'MultilineText';

export interface ChoiceOption {
  id: string;
  label: string;
  color: string; // hex color for badge
}

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  required: boolean;
  description?: string;
  defaultValue?: unknown;
  // Choice-specific
  choices?: ChoiceOption[];
  // Number-specific
  numberFormat?: 'integer' | 'decimal' | 'percentage' | 'currency';
  // DateTime-specific
  dateFormat?: 'date' | 'datetime';
  // Lookup-specific
  lookupListId?: string;
  lookupColumnId?: string;
  // Display
  width?: number;
  hidden?: boolean;
  order: number;
}

// ─── List Item ────────────────────────────────────────────────────────────────
export interface ListItem {
  id: string;
  listId: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  version: number;
}

// ─── View ─────────────────────────────────────────────────────────────────────
export type ViewType = 'grid' | 'calendar' | 'gallery' | 'board';

export interface ViewFilter {
  id: string;
  columnId: string;
  operator:
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'notContains'
    | 'greaterThan'
    | 'lessThan'
    | 'isEmpty'
    | 'isNotEmpty'
    | 'between';
  value: unknown;
  value2?: unknown; // for 'between'
}

export interface ViewSort {
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface ConditionalFormattingRule {
  id: string;
  name: string;
  columnId: string;
  operator: ViewFilter['operator'];
  value: unknown;
  style: {
    backgroundColor?: string;
    color?: string;
    fontWeight?: 'bold' | 'normal';
    fontStyle?: 'italic' | 'normal';
  };
  applyTo: 'row' | 'cell';
}

export interface ListView {
  id: string;
  listId: string;
  name: string;
  type: ViewType;
  filters: ViewFilter[];
  sorts: ViewSort[];
  groupBy?: string;
  calendarColumn?: string; // for calendar view
  galleryImageColumn?: string; // for gallery view
  conditionalFormatting: ConditionalFormattingRule[];
  visibleColumns: string[];
  isDefault: boolean;
}

// ─── List ─────────────────────────────────────────────────────────────────────
export type ListColor =
  | 'blue'
  | 'green'
  | 'red'
  | 'orange'
  | 'purple'
  | 'teal'
  | 'pink'
  | 'yellow';

export interface ListPermission {
  userId: string;
  email: string;
  displayName: string;
  role: 'owner' | 'editor' | 'viewer';
}

export interface MSList {
  id: string;
  name: string;
  description?: string;
  color: ListColor;
  icon: string;
  ownerId: string;
  columns: Column[];
  views: ListView[];
  permissions: ListPermission[];
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  isFavorite: boolean;
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

// ─── Store State ──────────────────────────────────────────────────────────────
export interface ListsState {
  // Auth
  currentUser: AppUser | null;
  authLoading: boolean;

  // Lists
  lists: MSList[];
  selectedListId: string | null;
  listsLoading: boolean;

  // Items
  items: Record<string, ListItem[]>; // keyed by listId
  itemsLoading: boolean;

  // Active View
  activeViewId: string | null;

  // UI State
  searchQuery: string;
  isFilterPanelOpen: boolean;
  isSortPanelOpen: boolean;
  isColumnManagerOpen: boolean;
  isItemFormOpen: boolean;
  editingItemId: string | null;
  isConditionalFormattingOpen: boolean;
  isSharingPanelOpen: boolean;
  isDarkMode: boolean;
  selectedItemIds: Set<string>;
}
