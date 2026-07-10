import React, { useState, useEffect } from 'react';
import { Plus, List as ListIcon, Search, Settings, Download, Trash2, LayoutGrid } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    signInAnonymously(auth);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setIsLoading(false);
    });
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
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      createdAt: Date.now()
    });
    setNewItemTitle('');
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'items', id));
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-600 font-sans">
        <div className="text-center">
          <ListIcon size={48} className="mx-auto mb-4 text-purple-600 animate-pulse" />
          <p className="text-lg font-medium">Memuat Microsoft Lists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      <div className="w-64 bg-white border-r border-gray-200 p-5 flex flex-col shadow-sm z-10">
        <div className="flex items-center gap-3 mb-8 text-purple-700">
          <div className="bg-purple-100 p-2 rounded-lg">
            <LayoutGrid size={24} />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Microsoft Lists</h2>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Daftar Saya</p>
          <div className="bg-purple-50 text-purple-700 px-3 py-2.5 rounded-lg cursor-pointer font-medium flex items-center gap-3 transition-colors border border-purple-100">
            <ListIcon size={18} /> 
            Daftar Utama
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm z-0">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-900">Daftar Utama</h1>
            <div className="h-6 w-px bg-gray-300"></div>
            <button onClick={handleAddItem} className="bg-purple-700 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-purple-800 shadow-sm transition-all text-sm font-medium">
              <Plus size={16} /> New
            </button>
          </div>
          <div className="flex items-center gap-5 text-gray-500">
            <Search size={20} className="cursor-pointer hover:text-purple-600 transition-colors" />
            <Settings size={20} className="cursor-pointer hover:text-purple-600 transition-colors" />
            <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white shadow-md border-2 border-white ring-2 ring-gray-100">
              R
            </div>
          </div>
        </header>
        <div className="p-8 flex-1 overflow-auto bg-[#F9FAFB]">
          <div className="flex gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <input 
              value={newItemTitle} 
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder="Ketik judul item baru di sini..." 
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all text-sm"
            />
            <button onClick={handleAddItem} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-200 hover:text-gray-900 font-medium text-sm transition-all">
              Tambah
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="py-4 px-6 font-semibold w-1/2">Judul Item</th>
                  <th className="py-4 px-6 font-semibold">Status</th>
                  <th className="py-4 px-6 font-semibold">Tanggal Dibuat</th>
                  <th className="py-4 px-6 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-gray-500">
                      <p className="font-medium text-gray-600">Belum ada item di daftar ini.</p>
                    </td>
                  </tr>
                ) : (
                  items.map(item => (
                    <tr key={item.id} className="hover:bg-purple-50/40 transition-colors group">
                      <td className="py-4 px-6 font-medium text-gray-900">{item.title}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-green-200">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500">{item.date}</td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}