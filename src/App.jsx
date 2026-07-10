import React, { useState, useEffect } from 'react';
import { Menu, Plus, Trash2, List as ListIcon, Loader2 } from 'lucide-react';
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
  const [user, setUser] = useState(null);
  const [lists, setLists] = useState([{ id: 'default', name: 'Daftar Utama' }]);
  const [allItems, setAllItems] = useState([]);
  const [activeListId, setActiveListId] = useState('default');
  const [newItemTitle, setNewItemTitle] = useState('');

  useEffect(() => {
    signInAnonymously(auth);
    onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'items');
    const unsub = onSnapshot(itemsRef, (snapshot) => {
      setAllItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user]);

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;
    const itemsRef = collection(db, 'artifacts', appId, 'public', 'data', 'items');
    await addDoc(itemsRef, {
      title: newItemTitle,
      listId: activeListId,
      status: 'Baru',
      createdAt: new Date().toISOString()
    });
    setNewItemTitle('');
  };

  const handleDeleteItem = async (id) => {
    const itemRef = doc(db, 'artifacts', appId, 'public', 'data', 'items', id);
    await deleteDoc(itemRef);
  };

  if (!user) return <div className="flex h-screen items-center justify-center">Memuat aplikasi...</div>;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <div className="w-64 bg-white border-r p-4">
        <h2 className="font-bold text-lg mb-6">Microsoft Lists</h2>
        {lists.map(list => (
          <button 
            key={list.id}
            onClick={() => setActiveListId(list.id)}
            className={`flex items-center w-full p-2 rounded ${activeListId === list.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}`}
          >
            <ListIcon className="mr-2 h-4 w-4" /> {list.name}
          </button>
        ))}
      </div>

      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6">Daftar Item</h1>
        
        <div className="flex gap-2 mb-6">
          <input 
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Tambah item baru..."
            className="border p-2 rounded flex-1"
          />
          <button onClick={handleAddItem} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center">
            <Plus className="h-4 w-4 mr-1" /> Tambah
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3">Judul</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {allItems.filter(i => i.listId === activeListId).map(item => (
                <tr key={item.id} className="border-b">
                  <td className="px-6 py-4">{item.title}</td>
                  <td className="px-6 py-4">{item.status}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}