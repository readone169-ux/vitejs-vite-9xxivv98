import React, { useState, useEffect } from 'react';
import {
  Menu,
  Grid,
  List as ListIcon,
  Plus,
  Settings,
  Bell,
  HelpCircle,
  Search,
  MoreHorizontal,
  Check,
  X,
  Calendar,
  Type,
  Hash,
  AlignLeft,
  Trash2,
  Edit2,
  ChevronDown,
  CheckSquare,
  LayoutGrid,
  Download,
  Share2,
  Copy,
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: "AIzaSyBY8gz_YjKhYdM-XGuAWwq-aj2Ipgvaw-Y",
  authDomain: "aplikasi-list-kantor.firebaseapp.com",
  projectId: "aplikasi-list-kantor",
  storageBucket: "aplikasi-list-kantor.firebasestorage.app",
  messagingSenderId: "1036894354417",
  appId: "1:1036894354417:web:c95f8b435bc8294e47e250"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "default-app-id";

// --- HELPER COMPONENTS ---
const Badge = ({ children, colorClass = 'bg-gray-100 text-gray-800' }) => (
  <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
    {children}
  </span>
);

const getStatusColor = (status) => {
  if (!status) return 'bg-gray-100 text-gray-800';
  const s = status.toLowerCase();
  if (s.includes('selesai') || s.includes('baik'))
    return 'bg-green-100 text-green-800';
  if (s.includes('proses') || s.includes('sedang'))
    return 'bg-blue-100 text-blue-800';
  if (s.includes('baru') || s.includes('tinggi'))
    return 'bg-purple-100 text-purple-800';
  if (s.includes('rusak') || s.includes('hilang'))
    return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [user, setUser] = useState(null);
  const [lists, setLists] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copySuccess, setCopySuccess] = useState('');

  // Modals state
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isNewColumnModalOpen, setIsNewColumnModalOpen] = useState(false);

  // --- 1. AUTHENTICATION ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== 'undefined' &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error('Auth error:', error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- 2. DATA FETCHING (REAL-TIME) ---
  useEffect(() => {
    if (!user) return;

    // Listen to Lists
    const listsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'lists'
    );
    const unsubLists = onSnapshot(
      listsRef,
      (snapshot) => {
        const fetchedLists = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLists(fetchedLists);
        if (fetchedLists.length > 0 && !activeListId) {
          setActiveListId(fetchedLists[0].id);
        }
      },
      (error) => console.error('Error fetching lists:', error)
    );

    // Listen to Items
    const itemsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'items'
    );
    const unsubItems = onSnapshot(
      itemsRef,
      (snapshot) => {
        const fetchedItems = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllItems(fetchedItems);
      },
      (error) => console.error('Error fetching items:', error)
    );

    return () => {
      unsubLists();
      unsubItems();
    };
  }, [user, activeListId]);

  const activeList = lists.find((l) => l.id === activeListId);
  const currentListItems = allItems.filter(
    (item) => item.listId === activeListId
  );

  // --- 3. HANDLERS (WRITE TO DATABASE) ---
  const handleAddItem = async (newItemData) => {
    if (!user || !activeListId) return;
    const newItemRef = doc(
      collection(db, 'artifacts', appId, 'public', 'data', 'items')
    );
    await setDoc(newItemRef, {
      ...newItemData,
      listId: activeListId,
      createdAt: new Date().toISOString(),
    });
    setIsNewItemModalOpen(false);
  };

  const handleDeleteItem = async (itemId) => {
    if (!user) return;
    await deleteDoc(
      doc(db, 'artifacts', appId, 'public', 'data', 'items', itemId)
    );
  };

  const handleAddColumn = async (columnData) => {
    if (!user || !activeList) return;
    const listRef = doc(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'lists',
      activeListId
    );
    const updatedColumns = [
      ...(activeList.columns || []),
      { id: `c_${Date.now()}`, ...columnData },
    ];
    await updateDoc(listRef, { columns: updatedColumns });
    setIsNewColumnModalOpen(false);
  };

  const handleCreateNewList = async () => {
    if (!user) return;
    const newListRef = doc(
      collection(db, 'artifacts', appId, 'public', 'data', 'lists')
    );
    const newList = {
      name: 'Daftar Baru',
      color: 'bg-teal-500',
      icon: 'List',
      columns: [{ id: 'c_title', name: 'Judul', type: 'text' }],
      createdAt: new Date().toISOString(),
    };
    await setDoc(newListRef, newList);
    setActiveListId(newListRef.id);
  };

  // --- 4. EXPORT TO CSV (LAPORAN) ---
  const exportToCSV = () => {
    if (!activeList || currentListItems.length === 0) return;

    // Create Headers
    const headers = activeList.columns.map((col) => `"${col.name}"`).join(',');

    // Create Rows
    const rows = currentListItems
      .map((item) => {
        return activeList.columns
          .map((col) => {
            let val = item[col.id] || '';
            if (col.type === 'date' && val) {
              val = new Date(val).toLocaleDateString('id-ID');
            }
            return `"${String(val).replace(/"/g, '""')}"`; // Escape quotes
          })
          .join(',');
      })
      .join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Laporan_${activeList.name}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 5. SHARE LINK ---
  const handleShare = () => {
    // In a real environment, you might append ?listId=... to the URL
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopySuccess('Link disalin!');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">
        Memuat koneksi ke server...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-white font-sans text-gray-800 overflow-hidden">
      {/* M365 Top Navigation Bar */}
      <header className="flex items-center justify-between h-12 bg-[#0078d4] text-white px-4 shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 rounded"
          >
            <LayoutGrid size={20} />
          </button>
          <span className="font-semibold text-lg tracking-wide">
            Lists Workspace
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Status Online */}
          <div className="flex items-center text-xs bg-green-500/20 px-2 py-1 rounded-full border border-green-400/30">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Online & Tersinkronisasi
          </div>
          <button className="p-2 hover:bg-white/10 rounded hidden sm:block">
            <Settings size={20} />
          </button>
          <div className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center text-sm font-bold ml-2 border border-white/20 shadow-sm cursor-pointer">
            ID
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? 'w-64' : 'w-0 hidden'
          } flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col transition-all duration-300`}
        >
          <div className="p-4">
            <button
              onClick={handleCreateNewList}
              className="flex items-center justify-center w-full space-x-2 bg-white border border-gray-300 text-gray-700 py-2 rounded shadow-sm hover:bg-gray-50 font-medium transition"
            >
              <Plus size={18} />
              <span>Buat Daftar Baru</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            <div className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Semua Daftar (Publik)
            </div>
            <ul className="space-y-1 px-2">
              {lists.map((list) => (
                <li key={list.id}>
                  <button
                    onClick={() => setActiveListId(list.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      activeListId === list.id
                        ? 'bg-gray-200 font-medium'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center text-white ${
                        list.color || 'bg-gray-500'
                      }`}
                    >
                      <ListIcon size={14} />
                    </div>
                    <span className="truncate">{list.name}</span>
                  </button>
                </li>
              ))}
              {lists.length === 0 && (
                <div className="px-4 py-4 text-sm text-gray-400 text-center">
                  Belum ada daftar. Buat satu untuk memulai kolaborasi.
                </div>
              )}
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
          {activeList ? (
            <>
              {/* Command Bar (Toolbar) */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
                <div className="flex items-center space-x-4">
                  <h1 className="text-xl font-semibold flex items-center">
                    <div
                      className={`w-8 h-8 rounded flex items-center justify-center text-white mr-3 ${
                        activeList.color || 'bg-gray-500'
                      }`}
                    >
                      <ListIcon size={18} />
                    </div>
                    {activeList.name}
                  </h1>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-green-600 font-medium">
                    {copySuccess}
                  </span>
                  <button
                    onClick={handleShare}
                    className="flex items-center text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded transition text-sm font-medium border border-gray-200 shadow-sm"
                  >
                    <Share2 size={16} className="mr-2 text-gray-500" />
                    Bagikan Tim
                  </button>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center px-6 py-2 border-b border-gray-100 space-x-4 bg-gray-50/50 text-sm">
                <button
                  onClick={() => setIsNewItemModalOpen(true)}
                  className="flex items-center text-[#0078d4] hover:bg-[#0078d4]/10 px-3 py-1.5 rounded transition font-medium"
                >
                  <Plus size={16} className="mr-1.5" />
                  Tambah Baris
                </button>
                <div className="h-4 w-px bg-gray-300"></div>
                <button
                  onClick={exportToCSV}
                  className="flex items-center text-gray-700 hover:bg-green-50 hover:text-green-700 px-3 py-1.5 rounded transition"
                  title="Unduh laporan bulanan ke Excel"
                >
                  <Download size={16} className="mr-1.5" />
                  Export Laporan (CSV)
                </button>
                <div className="flex-1"></div>
                <span className="text-xs text-gray-400">
                  Total {currentListItems.length} item
                </span>
              </div>

              {/* Data Table */}
              <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white sticky top-0 shadow-sm z-10">
                    <tr>
                      <th className="w-10 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <CheckSquare size={16} className="text-gray-300" />
                      </th>
                      {(activeList.columns || []).map((col) => (
                        <th
                          key={col.id}
                          className="px-6 py-3 text-left text-xs font-semibold text-gray-600 border-r border-gray-100 last:border-r-0 hover:bg-gray-50 cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center">
                              {col.type === 'text' && (
                                <Type
                                  size={14}
                                  className="mr-2 text-gray-400"
                                />
                              )}
                              {col.type === 'date' && (
                                <Calendar
                                  size={14}
                                  className="mr-2 text-gray-400"
                                />
                              )}
                              {col.type === 'choice' && (
                                <AlignLeft
                                  size={14}
                                  className="mr-2 text-gray-400"
                                />
                              )}
                              {col.type === 'number' && (
                                <Hash
                                  size={14}
                                  className="mr-2 text-gray-400"
                                />
                              )}
                              {col.name}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={() => setIsNewColumnModalOpen(true)}
                          className="text-xs font-medium text-gray-500 hover:text-[#0078d4] flex items-center bg-gray-50 px-2 py-1 rounded"
                        >
                          <Plus size={14} className="mr-1" /> Tambah Kolom
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentListItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={(activeList.columns?.length || 0) + 2}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          <img
                            src="https://res-1.cdn.office.net/files/fabric-cdn-prod_20230815.002/assets/brand-icons/product/svg/lists_48x1.svg"
                            alt="Lists"
                            className="w-16 h-16 mx-auto mb-4 opacity-50 grayscale"
                          />
                          <p className="text-lg mb-2 text-gray-800">
                            Daftar ini masih kosong
                          </p>
                          <p className="text-sm">
                            Mulai kolaborasi dengan mengklik 'Tambah Baris'.
                            Data akan tersimpan online.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      currentListItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 group transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="w-4 h-4 border border-gray-300 rounded-sm"></div>
                          </td>
                          {(activeList.columns || []).map((col) => (
                            <td
                              key={col.id}
                              className="px-6 py-3 whitespace-nowrap text-sm text-gray-800"
                            >
                              {col.type === 'choice' ? (
                                <Badge
                                  colorClass={getStatusColor(item[col.id])}
                                >
                                  {item[col.id] || '-'}
                                </Badge>
                              ) : col.type === 'date' ? (
                                item[col.id] ? (
                                  new Date(item[col.id]).toLocaleDateString(
                                    'id-ID',
                                    {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    }
                                  )
                                ) : (
                                  '-'
                                )
                              ) : (
                                <span>{item[col.id] || '-'}</span>
                              )}
                            </td>
                          ))}
                          <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 hover:bg-red-100 hover:text-red-600 rounded text-gray-400 transition"
                              title="Hapus baris ini dari database"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50/50">
              <LayoutGrid size={48} className="text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-700">
                Pilih atau buat daftar baru
              </p>
              <p className="text-sm">
                Semua daftar yang Anda buat akan langsung tersinkronisasi
                online.
              </p>
            </div>
          )}

          {/* Modals */}
          {isNewItemModalOpen && (
            <NewItemModal
              columns={activeList.columns || []}
              onClose={() => setIsNewItemModalOpen(false)}
              onSave={handleAddItem}
            />
          )}

          {isNewColumnModalOpen && (
            <NewColumnModal
              onClose={() => setIsNewColumnModalOpen(false)}
              onSave={handleAddColumn}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTS FOR MODALS ---

function NewItemModal({ columns, onClose, onSave }) {
  const [formData, setFormData] = useState({});

  const handleChange = (colId, value) => {
    setFormData((prev) => ({ ...prev, [colId]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end backdrop-blur-sm">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Tambah Baris Data</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form
            id="new-item-form"
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {columns.length === 0 && (
              <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded border border-yellow-200">
                Daftar ini belum memiliki kolom. Tambahkan kolom terlebih
                dahulu.
              </p>
            )}
            {columns.map((col) => (
              <div key={col.id}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {col.name}
                </label>

                {col.type === 'text' && (
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
                    onChange={(e) => handleChange(col.id, e.target.value)}
                  />
                )}

                {col.type === 'number' && (
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
                    onChange={(e) => handleChange(col.id, e.target.value)}
                  />
                )}

                {col.type === 'date' && (
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
                    onChange={(e) => handleChange(col.id, e.target.value)}
                  />
                )}

                {col.type === 'choice' && (
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] bg-white"
                    onChange={(e) => handleChange(col.id, e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Pilih opsi...
                    </option>
                    {(col.options || []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="new-item-form"
            className="px-4 py-2 text-sm font-medium text-white bg-[#0078d4] rounded hover:bg-[#106ebe]"
          >
            Simpan ke Database
          </button>
        </div>
      </div>
    </div>
  );
}

function NewColumnModal({ onClose, onSave }) {
  const [colName, setColName] = useState('');
  const [colType, setColType] = useState('text');
  const [choices, setChoices] = useState('Selesai, Proses, Baru');

  const handleSubmit = (e) => {
    e.preventDefault();
    const newCol = {
      name: colName,
      type: colType,
    };
    if (colType === 'choice') {
      newCol.options = choices
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);
    }
    onSave(newCol);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Struktur Kolom Baru</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nama Kolom
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Tanggal Selesai"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
              value={colName}
              onChange={(e) => setColName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tipe Data
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] bg-white"
              value={colType}
              onChange={(e) => setColType(e.target.value)}
            >
              <option value="text">Teks Tunggal</option>
              <option value="number">Angka / Nominal</option>
              <option value="date">Tanggal</option>
              <option value="choice">Label Pilihan (Status)</option>
            </select>
          </div>

          {colType === 'choice' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Opsi Pilihan (Pisahkan dengan koma)
              </label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4]"
                value={choices}
                onChange={(e) => setChoices(e.target.value)}
              />
            </div>
          )}

          <div className="pt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-sm font-medium text-white bg-[#0078d4] rounded hover:bg-[#106ebe]"
            >
              Tambahkan
            </button>
          </div>
        </form>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.2s ease-out forwards;
        }
      `,
        }}
      />
    </div>
  );
}
