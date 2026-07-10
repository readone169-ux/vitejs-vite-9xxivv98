import React, { useState, useEffect } from "react";

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Default column types
const columnTypes = ["Text", "Number", "Date"];

function App() {
  const [lists, setLists] = useState(() => {
    const saved = localStorage.getItem("mslists_clone");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedListId, setSelectedListId] = useState(null);
  const [newListName, setNewListName] = useState("");
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState("Text");
  const [formData, setFormData] = useState({});

  // Save lists to localStorage on change
  useEffect(() => {
    localStorage.setItem("mslists_clone", JSON.stringify(lists));
  }, [lists]);

  // Create a new list
  const createList = () => {
    if (!newListName.trim()) return alert("List name required");
    const newList = {
      id: generateId(),
      name: newListName.trim(),
      columns: [
        { id: generateId(), name: "Title", type: "Text" }, // default column
      ],
      items: [],
    };
    setLists([...lists, newList]);
    setNewListName("");
    setSelectedListId(newList.id);
  };

  // Add column to selected list
  const addColumn = () => {
    if (!newColumnName.trim()) return alert("Column name required");
    setLists((prev) =>
      prev.map((list) => {
        if (list.id === selectedListId) {
          // Prevent duplicate column names
          if (list.columns.find((c) => c.name === newColumnName.trim())) {
            alert("Column name already exists");
            return list;
          }
          return {
            ...list,
            columns: [
              ...list.columns,
              { id: generateId(), name: newColumnName.trim(), type: newColumnType },
            ],
          };
        }
        return list;
      })
    );
    setNewColumnName("");
    setNewColumnType("Text");
  };

  // Add item to selected list
  const addItem = () => {
    const list = lists.find((l) => l.id === selectedListId);
    if (!list) return;
    // Validate required Title
    if (!formData.Title || !formData.Title.trim()) {
      return alert("Title is required");
    }
    // Build new item with all columns
    const newItem = {};
    for (const col of list.columns) {
      newItem[col.name] = formData[col.name] || "";
    }
    setLists((prev) =>
      prev.map((l) =>
        l.id === selectedListId ? { ...l, items: [...l.items, newItem] } : l
      )
    );
    setFormData({});
  };

  // Update form data on input change
  const onInputChange = (colName, value) => {
    setFormData((prev) => ({ ...prev, [colName]: value }));
  };

  // Delete item by index
  const deleteItem = (index) => {
    setLists((prev) =>
      prev.map((l) => {
        if (l.id === selectedListId) {
          const newItems = [...l.items];
          newItems.splice(index, 1);
          return { ...l, items: newItems };
        }
        return l;
      })
    );
  };

  const selectedList = lists.find((l) => l.id === selectedListId);

  return (
    <div style={{ fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif", padding: 20, maxWidth: 900, margin: "auto" }}>
      <h1>Microsoft Lists Clone</h1>

      {/* Create new list */}
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="New list name"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          style={{ padding: 8, fontSize: 16, width: 200 }}
        />
        <button onClick={createList} style={{ marginLeft: 10, padding: "8px 16px" }}>
          + New List
        </button>
      </div>

      {/* List selector */}
      <div style={{ marginBottom: 20 }}>
        <strong>Your Lists:</strong>{" "}
        {lists.length === 0 && <em>No lists created yet</em>}
        {lists.map((list) => (
          <button
            key={list.id}
            onClick={() => setSelectedListId(list.id)}
            style={{
              marginLeft: 10,
              padding: "6px 12px",
              backgroundColor: selectedListId === list.id ? "#0078d4" : "#eee",
              color: selectedListId === list.id ? "white" : "black",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {list.name}
          </button>
        ))}
      </div>

      {/* Selected list details */}
      {selectedList && (
        <>
          <h2>{selectedList.name}</h2>

          {/* Add column */}
          <div style={{ marginBottom: 20 }}>
            <input
              placeholder="New column name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              style={{ padding: 6, fontSize: 14, width: 150 }}
            />
            <select
              value={newColumnType}
              onChange={(e) => setNewColumnType(e.target.value)}
              style={{ padding: 6, fontSize: 14, marginLeft: 10 }}
            >
              {columnTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <button onClick={addColumn} style={{ marginLeft: 10, padding: "6px 12px" }}>
              + Add Column
            </button>
          </div>

          {/* Add item form */}
          <div style={{ marginBottom: 20, border: "1px solid #ccc", padding: 10, borderRadius: 4 }}>
            <h3>Add New Item</h3>
            {selectedList.columns.map((col) => (
              <div key={col.id} style={{ marginBottom: 10 }}>
                <label style={{ display: "block", marginBottom: 4 }}>
                  {col.name} ({col.type})
                </label>
                {col.type === "Text" && (
                  <input
                    type="text"
                    value={formData[col.name] || ""}
                    onChange={(e) => onInputChange(col.name, e.target.value)}
                    style={{ padding: 6, width: "100%" }}
                  />
                )}
                {col.type === "Number" && (
                  <input
                    type="number"
                    value={formData[col.name] || ""}
                    onChange={(e) => onInputChange(col.name, e.target.value)}
                    style={{ padding: 6, width: "100%" }}
                  />
                )}
                {col.type === "Date" && (
                  <input
                    type="date"
                    value={formData[col.name] || ""}
                    onChange={(e) => onInputChange(col.name, e.target.value)}
                    style={{ padding: 6, width: "100%" }}
                  />
                )}
              </div>
            ))}
            <button onClick={addItem} style={{ padding: "8px 16px" }}>
              Add Item
            </button>
          </div>

          {/* List view */}
          <div>
            <h3>Items</h3>
            {selectedList.items.length === 0 && <em>No items added yet</em>}
            {selectedList.items.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {selectedList.columns.map((col) => (
                      <th
                        key={col.id}
                        style={{
                          border: "1px solid #ccc",
                          padding: 8,
                          backgroundColor: "#f3f2f1",
                          textAlign: "left",
                        }}
                      >
                        {col.name}
                      </th>
                    ))}
                    <th style={{ border: "1px solid #ccc", padding: 8 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedList.items.map((item, idx) => (
                    <tr key={idx}>
                      {selectedList.columns.map((col) => (
                        <td key={col.id} style={{ border: "1px solid #ccc", padding: 8 }}>
                          {item[col.name]}
                        </td>
                      ))}
                      <td style={{ border: "1px solid #ccc", padding: 8 }}>
                        <button onClick={() => deleteItem(idx)} style={{ color: "red" }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
