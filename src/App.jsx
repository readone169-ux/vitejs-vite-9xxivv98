import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { LayoutGrid, List as ListIcon, Plus, Trash2, Download, Search } from 'lucide-react';

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

  useEffect(() => {
    signInAnonymously(auth);
    const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'items');
    const unsub = onSnapshot(itemsRef, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;
    const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'items');
    await addDoc(itemsRef, { 
      title: newItemTitle, 
      status: 'Baru', 
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    });
    setNewItemTitle('');
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'items', id));
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-8 text-purple-700">
          <LayoutGrid size={24} />
          <h2 className="font-bold text-lg">Microsoft Lists</h2>
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Daftar Saya</p>
        <div className="bg-purple-50 text-purple-700 px-3 py-2 rounded-md font-medium flex items-center gap-2">
          <ListIcon size={18} /> Daftar Utama
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white p-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Daftar Utama</h1>
          <div className="flex items-center gap-2">
            <button onClick={handleAddItem} className="bg-purple-700 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-purple-800 transition-all font-medium text-sm">
              <Plus size={16} /> New
            </button>
            <button className="text-gray-600 px-3 py-2 border rounded-md hover:bg-gray-100 transition-all text-sm font-medium flex items-center gap-2">
              <Download size={16}/> Export
            </button>
          </div>
        </header>
        
        <div className="p-6">
          <div className="flex gap-2 mb-6 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <input 
              className="flex-1 px-4 py-2 focus:outline-none"
              value={newItemTitle} 
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder="Ketik judul item baru di sini..." 
            />
            <button onClick={handleAddItem} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-200 font-medium transition-all">Tambah</button>
          </div>

          <table className="w-full bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 text-left font-semibold">Judul Item</th>
                <th className="p-4 text-left font-semibold">Status</th>
                <th className="p-4 text-left font-semibold">Tanggal</th>
                <th className="p-4 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr><td colSpan="4" className="p-10 text-center text-gray-400">Belum ada item di daftar ini.</td></tr>
              ) : (
                items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium">{item.title}</td>
                    <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">{item.status}</span></td>
                    <td className="p-4 text-gray-500">{item.date}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}