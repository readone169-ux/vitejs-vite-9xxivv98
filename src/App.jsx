import React, { useState, useEffect } from 'react';
import { Plus, Table as TableIcon, MoreHorizontal, Download, Share2, Search, Settings, HelpCircle, Trash2, Menu, ChevronDown, List as ListIcon } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';

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
  const [items, setItems] = useState([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    signInAnonymously(auth);
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'items');
    const unsub = onSnapshot(itemsRef, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user]);

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;
    const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'items');
    await addDoc(itemsRef, { 
      title: newItemTitle, 
      status: 'Baru', 
      date: new Date().toLocaleDateString(),
      createdAt: Date.now()
    });
    setNewItemTitle('');
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'items', id));
  };

  return (
    <div className="flex h-screen bg-white text-gray-800 font-sans">
      <div className="w-64 border-r border-gray-200 p-4 bg-gray-50">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-purple-700">
          <ListIcon size={24} /> Microsoft Lists
        </h2>
        <div className="space-y-1">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Daftar Saya</p>
          <div className="bg-purple-100 text-purple-800 p-2 rounded cursor-pointer font-medium flex items-center gap-2">
            <TableIcon size={16} /> Daftar Utama
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Daftar Utama</h1>
            <button className="bg-purple-700 text-white px-4 py-1.5 rounded flex items-center gap-2 hover:bg-purple-800 transition" onClick={handleAddItem}>
              <Plus size={18} /> New
            </button>
            <button className="text-gray-600 px-3 py-1.5 hover:bg-gray-100 rounded flex items-center gap-1"><Download size={16}/> Export</button>
          </div>
          <div className="flex items-center gap-4 text-gray-500">
            <Search size={20} className="cursor-pointer hover:text-gray-800" />
            <Settings size={20} className="cursor-pointer hover:text-gray-800" />
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center font-bold text-white">R</div>
          </div>
        </header>

        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <input 
              value={newItemTitle} 
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="Tambahkan item baru..." 
              className="border border-gray-300 rounded px-3 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button onClick={handleAddItem} className="bg-gray-100 px-4 py-2 rounded border hover:bg-gray-200">Tambah</button>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-sm">
                <th className="py-3 px-4 font-semibold">Judul</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Tanggal</th>
                <th className="py-3 px-4 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="py-3 px-4 font-medium">{item.title}</td>
                  <td className="py-3 px-4 text-sm">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">{item.status}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{item.date}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}