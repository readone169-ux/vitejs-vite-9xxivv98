import React, { useState, useEffect } from 'react';
import { Menu, Grid, List as ListIcon, Plus, Settings, Bell, HelpCircle, Search, MoreHorizontal, Check, X, Calendar, Type, Hash, AlignLeft, Trash2, Edit2, ChevronDown, CheckSquare, LayoutGrid, Download, Share2, Copy } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBY8gz_YjKHydM-XGuAWVq-aj2Ipgvaw-Y",
  authDomain: "aplikasi-list-kantor.firebaseapp.com",
  projectId: "aplikasi-list-kantor",
  storageBucket: "aplikasi-list-kantor.firebasestorage.app",
  messagingSenderId: "1036894354417",
  appId: "1:1036894354417:web:7a5f2f994ab405ee47e250"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "default-app-id";

export default function App() {
  const [user, setUser] = useState(null);
  const [lists, setLists] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [activeListId, setActiveListId] = useState(null);

  useEffect(() => {
    signInAnonymously(auth);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const listsRef = collection(db, 'artifacts', appId, 'public', 'data', 'lists');
    const unsubLists = onSnapshot(listsRef, (snapshot) => {
      const fetchedLists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLists(fetchedLists);
      if (fetchedLists.length > 0 && !activeListId) setActiveListId(fetchedLists[0].id);
    });
    const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'items');
    const unsubItems = onSnapshot(itemsRef, (snapshot) => {
      setAllItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubLists(); unsubItems(); };
  }, [user]);

  const activeList = lists.find(l => l.id === activeListId);
  const currentListItems = allItems.filter(item => item.listId === activeListId);

  if (!user) return <div className="flex h-screen items-center justify-center">Menghubungkan ke database...</div>;

  return (
    <div className="flex h-screen bg-gray-100">
      <main className="flex-1 overflow-auto p-6">
        <h1 className="text-2xl font-bold mb-4">{activeList ? activeList.name : "Daftar Lists"}</h1>
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="px-6 py-3 border-b text-left">Judul</th>
              <th className="px-6 py-3 border-b text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {currentListItems.length > 0 ? (
              currentListItems.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4 border-b">{item.title || "Tanpa Judul"}</td>
                  <td className="px-6 py-4 border-b">{item.status || "Baru"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="px-6 py-4 text-center text-gray-500">Belum ada item di daftar ini</td>
              </tr>
            )}
          </tbody>
        </table>
      </main>
    </div>
  );
}