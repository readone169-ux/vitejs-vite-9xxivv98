import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { LayoutGrid, Plus, Trash2, Download } from 'lucide-react';

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
    return onSnapshot(itemsRef, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'items'), { 
        title: newItemTitle, 
        status: 'Baru', 
        date: new Date().toLocaleDateString('id-ID')
      });
      setNewItemTitle('');
    } catch (e) {
      console.error("Gagal menambah:", e);
    }
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
        <div className="bg-purple-50 text-purple-700 px-3 py-2 rounded-md font-medium">Daftar Utama</div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white p-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-xl font-bold">Daftar Utama</h1>
          <button onClick={handleAddItem} className="bg-purple-700 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-purple-800">
            <Plus size={16} /> New
          </button>
        </header>
        
        <div className="p-6">
          <div className="flex gap-2 mb-6 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <input 
              className="flex-1 px-4 py-2 focus:outline-none"
              value={newItemTitle} 
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="Ketik judul item baru..." 
            />
            <button onClick={handleAddItem} className="bg-purple-700 text-white px-6 py-2 rounded-md hover:bg-purple-800">Tambah</button>
          </div>

          <table className="w-full bg-white shadow-sm border rounded-lg">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-4 text-left">Judul</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => (
                <tr key={item.id}>
                  <td className="p-4">{item.title}</td>
                  <td className="p-4 text-green-700 font-medium">{item.status}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={16} /></button>
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