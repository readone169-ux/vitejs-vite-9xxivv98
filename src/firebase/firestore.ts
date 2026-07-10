import {
    collection,
    doc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp,
    writeBatch,
    Timestamp,
    DocumentData,
    QuerySnapshot,
    Unsubscribe,
  } from 'firebase/firestore';
  import { db } from './config';
  import { MSList, ListItem, Column, ListView } from '@/types';
  
  // ─── Collections ──────────────────────────────────────────────────────────────
  const LISTS_COL = 'lists';
  const ITEMS_COL = (listId: string) => `lists/${listId}/items`;
  
  // ─── Lists CRUD ───────────────────────────────────────────────────────────────
  export const createList = async (
    list: Omit<MSList, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    const ref = await addDoc(collection(db, LISTS_COL), {
      ...list,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  };
  
  export const updateList = async (
    listId: string,
    updates: Partial<MSList>
  ): Promise<void> => {
    await updateDoc(doc(db, LISTS_COL, listId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  };
  
  export const deleteList = async (listId: string): Promise<void> => {
    // Delete all items first
    const itemsSnap = await getDocs(collection(db, ITEMS_COL(listId)));
    const batch = writeBatch(db);
    itemsSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, LISTS_COL, listId));
    await batch.commit();
  };
  
  export const subscribeToUserLists = (
    userId: string,
    callback: (lists: MSList[]) => void
  ): Unsubscribe => {
    const q = query(
      collection(db, LISTS_COL),
      where('ownerId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      const lists = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: (d.data().createdAt as Timestamp)?.toDate().toISOString() ?? '',
        updatedAt: (d.data().updatedAt as Timestamp)?.toDate().toISOString() ?? '',
      })) as MSList[];
      callback(lists);
    });
  };
  
  // ─── Items CRUD ───────────────────────────────────────────────────────────────
  export const createItem = async (
    listId: string,
    item: Omit<ListItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): Promise<string> => {
    const ref = await addDoc(collection(db, ITEMS_COL(listId)), {
      ...item,
      version: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // Update item count
    await updateDoc(doc(db, LISTS_COL, listId), {
      itemCount: (await getDoc(doc(db, LISTS_COL, listId))).data()?.itemCount + 1 || 1,
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  };
  
  export const updateItem = async (
    listId: string,
    itemId: string,
    data: Record<string, unknown>,
    userId: string
  ): Promise<void> => {
    const itemRef = doc(db, ITEMS_COL(listId), itemId);
    const current = await getDoc(itemRef);
    await updateDoc(itemRef, {
      data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
      version: (current.data()?.version ?? 0) + 1,
    });
  };
  
  export const deleteItem = async (
    listId: string,
    itemId: string
  ): Promise<void> => {
    await deleteDoc(doc(db, ITEMS_COL(listId), itemId));
    const listRef = doc(db, LISTS_COL, listId);
    const listSnap = await getDoc(listRef);
    const count = listSnap.data()?.itemCount ?? 1;
    await updateDoc(listRef, {
      itemCount: Math.max(0, count - 1),
      updatedAt: serverTimestamp(),
    });
  };
  
  export const subscribeToListItems = (
    listId: string,
    callback: (items: ListItem[]) => void
  ): Unsubscribe => {
    const q = query(
      collection(db, ITEMS_COL(listId)),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: (d.data().createdAt as Timestamp)?.toDate().toISOString() ?? '',
        updatedAt: (d.data().updatedAt as Timestamp)?.toDate().toISOString() ?? '',
      })) as ListItem[];
      callback(items);
    });
  };
  
  // ─── Column Management ────────────────────────────────────────────────────────
  export const updateColumns = async (
    listId: string,
    columns: Column[]
  ): Promise<void> => {
    await updateDoc(doc(db, LISTS_COL, listId), {
      columns,
      updatedAt: serverTimestamp(),
    });
  };
  
  // ─── View Management ──────────────────────────────────────────────────────────
  export const updateViews = async (
    listId: string,
    views: ListView[]
  ): Promise<void> => {
    await updateDoc(doc(db, LISTS_COL, listId), {
      views,
      updatedAt: serverTimestamp(),
    });
  };
  