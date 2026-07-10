import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '@/firebase/config';
import {
  createList,
  updateList,
  deleteList,
  createItem,
  updateItem,
  deleteItem,
  updateColumns,
  updateViews,
  subscribeToUserLists,
  subscribeToListItems,
} from '@/firebase/firestore';
import {
  MSList,
  ListItem,
  Column,
  ListView,
  ListsState,
  AppUser,
  ViewFilter,
  ViewSort,
  ConditionalFormattingRule,
  ListColor,
} from '@/types';
import { nanoid } from 'nanoid';

// ─── Default View Factory ─────────────────────────────────────────────────────
const createDefaultView = (listId: string): ListView => ({
  id: nanoid(),
  listId,
  name: 'All Items',
  type: 'grid',
  filters: [],
  sorts: [],
  conditionalFormatting: [],
  visibleColumns: [],
  isDefault: true,
});

// ─── Default Columns ──────────────────────────────────────────────────────────
const createDefaultColumns = (): Column[] => [
  {
    id: nanoid(),
    name: 'Title',
    type: 'Text',
    required: true,
    order: 0,
    width: 250,
  },
];

// ─── Store Interface ──────────────────────────────────────────────────────────
interface ListsActions {
  // Auth
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  initAuth: () => void;

  // Lists
  createNewList: (name: string, description: string, color: ListColor, icon: string) => Promise<void>;
  updateListMeta: (listId: string, updates: Partial<MSList>) => Promise<void>;
  removeList: (listId: string) => Promise<void>;
  selectList: (listId: string) => void;
  toggleFavorite: (listId: string) => Promise<void>;
  subscribeToLists: () => void;

  // Items
  addItem: (listId: string, data: Record<string, unknown>) => Promise<void>;
  editItem: (listId: string, itemId: string, data: Record<string, unknown>) => Promise<void>;
  removeItem: (listId: string, itemId: string) => Promise<void>;
  removeSelectedItems: (listId: string) => Promise<void>;
  subscribeToItems: (listId: string) => () => void;
  toggleItemSelection: (itemId: string) => void;
  clearSelection: () => void;
  selectAllItems: (listId: string) => void;

  // Columns
  addColumn: (listId: string, column: Omit<Column, 'id' | 'order'>) => Promise<void>;
  editColumn: (listId: string, columnId: string, updates: Partial<Column>) => Promise<void>;
  removeColumn: (listId: string, columnId: string) => Promise<void>;
  reorderColumns: (listId: string, columns: Column[]) => Promise<void>;

  // Views
  addView: (listId: string, view: Omit<ListView, 'id' | 'listId'>) => Promise<void>;
  editView: (listId: string, viewId: string, updates: Partial<ListView>) => Promise<void>;
  removeView: (listId: string, viewId: string) => Promise<void>;
  setActiveView: (viewId: string) => void;

  // Filters & Sorts
  addFilter: (listId: string, viewId: string, filter: Omit<ViewFilter, 'id'>) => Promise<void>;
  removeFilter: (listId: string, viewId: string, filterId: string) => Promise<void>;
  clearFilters: (listId: string, viewId: string) => Promise<void>;
  addSort: (listId: string, viewId: string, sort: ViewSort) => Promise<void>;
  removeSort: (listId: string, viewId: string, columnId: string) => Promise<void>;
  clearSorts: (listId: string, viewId: string) => Promise<void>;

  // Conditional Formatting
  addFormattingRule: (listId: string, viewId: string, rule: Omit<ConditionalFormattingRule, 'id'>) => Promise<void>;
  removeFormattingRule: (listId: string, viewId: string, ruleId: string) => Promise<void>;

  // UI
  setSearchQuery: (query: string) => void;
  toggleFilterPanel: () => void;
  toggleSortPanel: () => void;
  toggleColumnManager: () => void;
  openItemForm: (itemId?: string) => void;
  closeItemForm: () => void;
  toggleConditionalFormatting: () => void;
  toggleSharingPanel: () => void;
  toggleDarkMode: () => void;
}

type Store = ListsState & ListsActions;

// ─── Store ────────────────────────────────────────────────────────────────────
export const useListsStore = create<Store>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // ── Initial State ──────────────────────────────────────────────────
        currentUser: null,
        authLoading: true,
        lists: [],
        selectedListId: null,
        listsLoading: false,
        items: {},
        itemsLoading: false,
        activeViewId: null,
        searchQuery: '',
        isFilterPanelOpen: false,
        isSortPanelOpen: false,
        isColumnManagerOpen: false,
        isItemFormOpen: false,
        editingItemId: null,
        isConditionalFormattingOpen: false,
        isSharingPanelOpen: false,
        isDarkMode: false,
        selectedItemIds: new Set<string>(),

        // ── Auth ───────────────────────────────────────────────────────────
        initAuth: () => {
          onAuthStateChanged(auth, (user) => {
            if (user) {
              const appUser: AppUser = {
                uid: user.uid,
                email: user.email ?? '',
                displayName: user.displayName ?? 'User',
                photoURL: user.photoURL ?? undefined,
              };
              set((state) => {
                state.currentUser = appUser;
                state.authLoading = false;
              });
              get().subscribeToLists();
            } else {
              set((state) => {
                state.currentUser = null;
                state.authLoading = false;
                state.lists = [];
              });
            }
          });
        },

        signInWithGoogle: async () => {
          await signInWithPopup(auth, googleProvider);
        },

        signOutUser: async () => {
          await signOut(auth);
        },

        // ── Lists ──────────────────────────────────────────────────────────
        subscribeToLists: () => {
          const user = get().currentUser;
          if (!user) return;
          set((s) => { s.listsLoading = true; });
          subscribeToUserLists(user.uid, (lists) => {
            set((s) => {
              s.lists = lists;
              s.listsLoading = false;
            });
          });
        },

        createNewList: async (name, description, color, icon) => {
          const user = get().currentUser;
          if (!user) return;
          const defaultColumns = createDefaultColumns();
          const newList: Omit<MSList, 'id' | 'createdAt' | 'updatedAt'> = {
            name,
            description,
            color,
            icon,
            ownerId: user.uid,
            columns: defaultColumns,
            views: [createDefaultView('placeholder')],
            permissions: [
              { userId: user.uid, email: user.email, displayName: user.displayName, role: 'owner' },
            ],
            itemCount: 0,
            isFavorite: false,
          };
          const id = await createList(newList);
          // Update view with real listId
          const view = createDefaultView(id);
          await updateViews(id, [view]);
        },

        updateListMeta: async (listId, updates) => {
          await updateList(listId, updates);
        },

        removeList: async (listId) => {
          await deleteList(listId);
          set((s) => {
            if (s.selectedListId === listId) {
              s.selectedListId = null;
              s.activeViewId = null;
            }
          });
        },

        selectList: (listId) => {
          const list = get().lists.find((l) => l.id === listId);
          if (!list) return;
          const defaultView = list.views.find((v) => v.isDefault) ?? list.views[0];
          set((s) => {
            s.selectedListId = listId;
            s.activeViewId = defaultView?.id ?? null;
            s.searchQuery = '';
            s.selectedItemIds = new Set();
          });
        },

        toggleFavorite: async (listId) => {
          const list = get().lists.find((l) => l.id === listId);
          if (!list) return;
          await updateList(listId, { isFavorite: !list.isFavorite });
        },

        // ── Items ──────────────────────────────────────────────────────────
        subscribeToItems: (listId) => {
          set((s) => { s.itemsLoading = true; });
          const unsub = subscribeToListItems(listId, (items) => {
            set((s) => {
              s.items[listId] = items;
              s.itemsLoading = false;
            });
          });
          return unsub;
        },

        addItem: async (listId, data) => {
          const user = get().currentUser;
          if (!user) return;
          await createItem(listId, {
            listId,
            data,
            createdBy: user.uid,
            updatedBy: user.uid,
          });
        },

        editItem: async (listId, itemId, data) => {
          const user = get().currentUser;
          if (!user) return;
          await updateItem(listId, itemId, data, user.uid);
        },

        removeItem: async (listId, itemId) => {
          await deleteItem(listId, itemId);
          set((s) => {
            s.selectedItemIds.delete(itemId);
          });
        },

        removeSelectedItems: async (listId) => {
          const ids = Array.from(get().selectedItemIds);
          await Promise.all(ids.map((id) => deleteItem(listId, id)));
          set((s) => { s.selectedItemIds = new Set(); });
        },

        toggleItemSelection: (itemId) => {
          set((s) => {
            if (s.selectedItemIds.has(itemId)) {
              s.selectedItemIds.delete(itemId);
            } else {
              s.selectedItemIds.add(itemId);
            }
          });
        },

        clearSelection: () => set((s) => { s.selectedItemIds = new Set(); }),

        selectAllItems: (listId) => {
          const items = get().items[listId] ?? [];
          set((s) => { s.selectedItemIds = new Set(items.map((i) => i.id)); });
        },

        // ── Columns ────────────────────────────────────────────────────────
        addColumn: async (listId, colDef) => {
          const list = get().lists.find((l) => l.id === listId);
          if (!list) return;
          const newCol: Column = {
            ...colDef,
            id: nanoid(),
            order: list.columns.length,
          };
          const updated = [...list.columns, newCol];
          await updateColumns(listId, updated);
        },

        editColumn: async (listId, columnId, updates) => {
          const list = get().lists.find((l) => l.id === listId);
          if (!list) return;
          const updated = list.columns.map((c) =>
            c.id === columnId ? { ...c, ...updates } : c
          );
          await updateColumns(listId, updated);
        },

        removeColumn: async (listId, columnId) => {
          const list = get().lists.find((l) => l.id === listId);
          if (!list) return;
          const updated = list.columns
            .filter((c) => c.id !== columnId)
            .map((c, i) => ({ ...c, order: i }));
          await updateColumns(listId, updated);
        },

        reorderColumns: async (listId, columns) => {
          await updateColumns(listId, columns);
        },

        // ── Views ──────────────────────────────────────────────────────────
        addView: async (listId, viewDef) => {
          const list = get().lists.find((l) => l.id === listId);
          if (!list) return;
          const newView: ListView = { ...viewDef, id: nanoid(), listId };
          await updateViews(listId, [...list.views, newView]);
          set((s) => { s.activeViewId = newView.id; });
        },

        editView: async (listId, viewId, updates) => {
          const list = get().lists.find((l) => l.id === listId);
          if (!list) return;
          const updated = list.views.map((v) =>
            v.id === viewId ? { ...v, ...updates } : v
          );
          await updateViews(listId, updated);
        },

        removeView: async (listId, viewId) => {
          const list = get().lists.find((l) => l.id === listId);
          if (!list) return;
          const updated = list.views.filter((v) => v.id !== viewId);
          await updateViews(listId, updated);
          if (get().activeViewId === viewId) {
            set((s) => { s.activeViewId = updated[0]?.id ?? null; });
          }
        },

        setActiveView: (viewId) => set((s) => { s.activeViewId = viewId; }),

        // ── Filters ────────────────────────────────────────────────────────
        addFilter: async (listId, viewId, filterDef) => {
          const list
