// frontend/src/pages/Branch_admin/Inventory.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import "./styles/Inventory.css";

const API_BASE = "http://localhost:5000/api/inventory";

const CATEGORIES = [
  "uniforms",
  "shoes",
  "stationery",
  "books",
  "office_supplies",
  "other",
];

export default function Inventory() {
  const [activeTab, setActiveTab] = useState("stock");
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [itemForm, setItemForm] = useState({
    id: "",
    name: "",
    category: "",
    description: "",
    minQuantity: 0,
    unit: "pieces",
  });
  const [purchaseForm, setPurchaseForm] = useState({
    item_id: "",
    quantity: "",
    supplierName: "",
    invoiceNumber: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [transferForm, setTransferForm] = useState({
    fromBranch_id: "",
    itemName: "",
    itemCategory: "",
    quantity: "",
    notes: "",
  });
  const [adjustmentForm, setAdjustmentForm] = useState({
    item_id: "",
    quantity: "",
    reason: "",
    description: "",
  });
  const [openingStockForm, setOpeningStockForm] = useState([]);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [transferStatusFilter, setTransferStatusFilter] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const branchId = user.branch_id || user.branchId || null;

  // Load branches for transfer
  useEffect(() => {
    if (branchId && activeTab === "transfer") {
      loadBranches();
    }
  }, [branchId, activeTab]);

  // Load data based on active tab
  useEffect(() => {
    if (branchId) {
      if (activeTab === "stock") {
        loadItems();
      } else if (activeTab === "purchase") {
        loadPurchases();
        loadItems();
      } else if (activeTab === "transfer") {
        loadTransfers();
        loadItems();
      } else if (activeTab === "adjustment") {
        loadAdjustments();
        loadItems();
      } else if (activeTab === "opening") {
        loadItems();
      } else if (activeTab === "reports") {
        loadItems();
      }
    }
  }, [branchId, activeTab]);

  const loadBranches = async () => {
    try {
      const instId = user.institution_id || user.institutionId;
      if (!instId) return;
      const res = await axios.get(
        `http://localhost:5000/api/institution/${instId}/branches`
      );
      setBranches(res.data.filter((b) => String(b._id) !== String(branchId)));
    } catch (err) {
      console.error("LOAD BRANCHES ERROR", err);
    }
  };

  const loadItems = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/items`, {
        params: { branchId, category: categoryFilter || undefined },
      });
      setItems(res.data);
    } catch (err) {
      console.error("LOAD ITEMS ERROR", err);
      setError("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const loadPurchases = async () => {
    if (!branchId) return;
    try {
      const res = await axios.get(`${API_BASE}/purchases`, {
        params: { branchId },
      });
      setPurchases(res.data);
    } catch (err) {
      console.error("LOAD PURCHASES ERROR", err);
    }
  };

  const loadTransfers = async () => {
    if (!branchId) return;
    try {
      const res = await axios.get(`${API_BASE}/transfers`, {
        params: {
          branchId,
          status: transferStatusFilter || undefined,
        },
      });
      setTransfers(res.data);
    } catch (err) {
      console.error("LOAD TRANSFERS ERROR", err);
    }
  };

  const loadAdjustments = async () => {
    if (!branchId) return;
    try {
      const res = await axios.get(`${API_BASE}/adjustments`, {
        params: { branchId },
      });
      setAdjustments(res.data);
    } catch (err) {
      console.error("LOAD ADJUSTMENTS ERROR", err);
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!branchId) return;
    setError("");
    try {
      if (itemForm.id) {
        await axios.put(`${API_BASE}/items/${itemForm.id}`, {
          name: itemForm.name,
          description: itemForm.description,
          minQuantity: Number(itemForm.minQuantity),
          unit: itemForm.unit,
        });
      } else {
        await axios.post(`${API_BASE}/items`, {
          branch_id: branchId,
          category: itemForm.category,
          name: itemForm.name,
          description: itemForm.description,
          minQuantity: Number(itemForm.minQuantity),
          unit: itemForm.unit,
        });
      }
      resetItemForm();
      loadItems();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save item");
    }
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!branchId) return;
    setError("");
    try {
      await axios.post(`${API_BASE}/purchases`, {
        branch_id: branchId,
        item_id: purchaseForm.item_id,
        quantity: Number(purchaseForm.quantity),
        supplierName: purchaseForm.supplierName,
        invoiceNumber: purchaseForm.invoiceNumber,
        purchaseDate: purchaseForm.purchaseDate,
        notes: purchaseForm.notes,
      });
      resetPurchaseForm();
      loadPurchases();
      loadItems();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create purchase entry");
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!branchId) return;
    setError("");
    try {
      await axios.post(`${API_BASE}/transfers`, {
        fromBranch_id: transferForm.fromBranch_id,
        toBranch_id: branchId,
        itemName: transferForm.itemName,
        itemCategory: transferForm.itemCategory,
        quantity: Number(transferForm.quantity),
        notes: transferForm.notes,
        requestedBy: user.id || user._id,
      });
      resetTransferForm();
      loadTransfers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create transfer request");
    }
  };

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    if (!branchId) return;
    setError("");
    try {
      await axios.post(`${API_BASE}/adjustments`, {
        branch_id: branchId,
        item_id: adjustmentForm.item_id,
        quantity: Number(adjustmentForm.quantity),
        reason: adjustmentForm.reason,
        description: adjustmentForm.description,
        adjustedBy: user.id || user._id,
      });
      resetAdjustmentForm();
      loadAdjustments();
      loadItems();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create adjustment");
    }
  };

  const handleOpeningStockSubmit = async (e) => {
    e.preventDefault();
    if (!branchId) return;
    setError("");
    try {
      const itemsToSubmit = openingStockForm
        .filter((item) => item.item_id && item.quantity > 0)
        .map((item) => ({
          item_id: item.item_id,
          quantity: Number(item.quantity),
        }));

      if (itemsToSubmit.length === 0) {
        setError("Please add at least one item with quantity");
        return;
      }

      await axios.post(`${API_BASE}/opening-stock`, {
        branch_id: branchId,
        items: itemsToSubmit,
        adjustedBy: user.id || user._id,
      });
      setOpeningStockForm([]);
      loadItems();
      alert("Opening stock set successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to set opening stock");
    }
  };

  const handleApproveTransfer = async (transferId) => {
    if (!branchId) return;
    try {
      await axios.put(`${API_BASE}/transfers/${transferId}/approve`, {
        approvedBy: user.id || user._id,
      });
      loadTransfers();
      loadItems();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve transfer");
    }
  };

  const handleRejectTransfer = async (transferId) => {
    if (!branchId) return;
    try {
      await axios.put(`${API_BASE}/transfers/${transferId}/reject`, {
        approvedBy: user.id || user._id,
      });
      loadTransfers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject transfer");
    }
  };

  const resetItemForm = () => {
    setItemForm({
      id: "",
      name: "",
      category: "",
      description: "",
      minQuantity: 0,
      unit: "pieces",
    });
  };

  const resetPurchaseForm = () => {
    setPurchaseForm({
      item_id: "",
      quantity: "",
      supplierName: "",
      invoiceNumber: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const resetTransferForm = () => {
    setTransferForm({
      fromBranch_id: "",
      itemName: "",
      itemCategory: "",
      quantity: "",
      notes: "",
    });
  };

  const resetAdjustmentForm = () => {
    setAdjustmentForm({
      item_id: "",
      quantity: "",
      reason: "",
      description: "",
    });
  };

  const startEditItem = (item) => {
    setItemForm({
      id: item._id,
      name: item.name,
      category: item.category,
      description: item.description || "",
      minQuantity: item.minQuantity,
      unit: item.unit,
    });
  };

  const addOpeningStockRow = () => {
    setOpeningStockForm([
      ...openingStockForm,
      { item_id: "", quantity: "" },
    ]);
  };

  const removeOpeningStockRow = (index) => {
    setOpeningStockForm(openingStockForm.filter((_, i) => i !== index));
  };

  const updateOpeningStockRow = (index, field, value) => {
    const updated = [...openingStockForm];
    updated[index] = { ...updated[index], [field]: value };
    setOpeningStockForm(updated);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter transfers
  const filteredTransfers = transfers.filter((transfer) => {
    if (!transferStatusFilter) return true;
    return transfer.status === transferStatusFilter;
  });

  // Get low stock items
  const lowStockItems = items.filter(
    (item) => item.currentStock < item.minQuantity
  );

  if (!branchId) {
    return (
      <div className="inventory-container">
        <div className="error-message">
          Branch ID not found. Please log in again.
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>Inventory Management</h1>
        {lowStockItems.length > 0 && (
          <div className="low-stock-alert">
            {lowStockItems.length} item(s) below minimum stock
          </div>
        )}
      </div>

      <div className="inventory-tabs">
        <button
          className={activeTab === "stock" ? "active" : ""}
          onClick={() => setActiveTab("stock")}
        >
          Current Stock
        </button>
        <button
          className={activeTab === "purchase" ? "active" : ""}
          onClick={() => setActiveTab("purchase")}
        >
          Purchase Entry
        </button>
        <button
          className={activeTab === "transfer" ? "active" : ""}
          onClick={() => setActiveTab("transfer")}
        >
          Stock Transfer
        </button>
        <button
          className={activeTab === "adjustment" ? "active" : ""}
          onClick={() => setActiveTab("adjustment")}
        >
          Adjustments
        </button>
        <button
          className={activeTab === "opening" ? "active" : ""}
          onClick={() => setActiveTab("opening")}
        >
          Opening Stock
        </button>
        <button
          className={activeTab === "reports" ? "active" : ""}
          onClick={() => setActiveTab("reports")}
        >
          Reports
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Current Stock Tab */}
      {activeTab === "stock" && (
        <div className="inventory-content">
          <div className="filters">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace("_", " ")}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={resetItemForm} className="btn-primary">
              Add New Item
            </button>
          </div>

          <form onSubmit={handleItemSubmit} className="item-form">
            <h3>{itemForm.id ? "Edit Item" : "Add New Item"}</h3>
            <div className="form-grid">
              <div>
                <label>Name *</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label>Category *</label>
                <select
                  value={itemForm.category}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, category: e.target.value })
                  }
                  required
                  disabled={!!itemForm.id}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1).replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Description</label>
                <input
                  type="text"
                  value={itemForm.description}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, description: e.target.value })
                  }
                />
              </div>
              <div>
                <label>Minimum Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={itemForm.minQuantity}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      minQuantity: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label>Unit</label>
                <input
                  type="text"
                  value={itemForm.unit}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, unit: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {itemForm.id ? "Update" : "Create"}
              </button>
              {itemForm.id && (
                <button
                  type="button"
                  onClick={resetItemForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="items-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Min Quantity</th>
                  <th>Unit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item._id}
                    className={item.isLowStock ? "low-stock" : ""}
                  >
                    <td>{item.name}</td>
                    <td>
                      {item.category.charAt(0).toUpperCase() +
                        item.category.slice(1).replace("_", " ")}
                    </td>
                    <td>{item.currentStock}</td>
                    <td>{item.minQuantity}</td>
                    <td>{item.unit}</td>
                    <td>
                      {item.isLowStock ? (
                        <span className="badge-warning">Low Stock</span>
                      ) : (
                        <span className="badge-success">OK</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => startEditItem(item)}
                        className="btn-small"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <div className="empty-state">No items found</div>
            )}
          </div>
        </div>
      )}

      {/* Purchase Entry Tab */}
      {activeTab === "purchase" && (
        <div className="inventory-content">
          <form onSubmit={handlePurchaseSubmit} className="purchase-form">
            <h3>Record Purchase</h3>
            <div className="form-grid">
              <div>
                <label>Item *</label>
                <select
                  value={purchaseForm.item_id}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, item_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select item</option>
                  {items.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} ({item.category})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={purchaseForm.quantity}
                  onChange={(e) =>
                    setPurchaseForm({
                      ...purchaseForm,
                      quantity: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label>Supplier Name *</label>
                <input
                  type="text"
                  value={purchaseForm.supplierName}
                  onChange={(e) =>
                    setPurchaseForm({
                      ...purchaseForm,
                      supplierName: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label>Invoice Number</label>
                <input
                  type="text"
                  value={purchaseForm.invoiceNumber}
                  onChange={(e) =>
                    setPurchaseForm({
                      ...purchaseForm,
                      invoiceNumber: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label>Purchase Date *</label>
                <input
                  type="date"
                  value={purchaseForm.purchaseDate}
                  onChange={(e) =>
                    setPurchaseForm({
                      ...purchaseForm,
                      purchaseDate: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label>Notes</label>
                <input
                  type="text"
                  value={purchaseForm.notes}
                  onChange={(e) =>
                    setPurchaseForm({ ...purchaseForm, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <button type="submit" className="btn-primary">
              Record Purchase
            </button>
          </form>

          <div className="purchases-list">
            <h3>Recent Purchases</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Supplier</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {purchases.slice(0, 20).map((purchase) => (
                  <tr key={purchase._id}>
                    <td>
                      {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </td>
                    <td>
                      {purchase.item_id?.name || "N/A"} (
                      {purchase.item_id?.category || "N/A"})
                    </td>
                    <td>{purchase.quantity}</td>
                    <td>{purchase.supplierName}</td>
                    <td>{purchase.invoiceNumber || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {purchases.length === 0 && (
              <div className="empty-state">No purchases recorded</div>
            )}
          </div>
        </div>
      )}

      {/* Stock Transfer Tab */}
      {activeTab === "transfer" && (
        <div className="inventory-content">
          <form onSubmit={handleTransferSubmit} className="transfer-form">
            <h3>Request Stock Transfer</h3>
            <div className="form-grid">
              <div>
                <label>From Branch *</label>
                <select
                  value={transferForm.fromBranch_id}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      fromBranch_id: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Item Name *</label>
                <input
                  type="text"
                  value={transferForm.itemName}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      itemName: e.target.value,
                    })
                  }
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div>
                <label>Item Category *</label>
                <select
                  value={transferForm.itemCategory}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      itemCategory: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1).replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Quantity *</label>
                <input
                  type="number"
                  min="1"
                  value={transferForm.quantity}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      quantity: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label>Notes</label>
                <input
                  type="text"
                  value={transferForm.notes}
                  onChange={(e) =>
                    setTransferForm({ ...transferForm, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <button type="submit" className="btn-primary">
              Request Transfer
            </button>
          </form>

          <div className="transfers-list">
            <div className="filters">
              <select
                value={transferStatusFilter}
                onChange={(e) => setTransferStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <h3>Transfer Requests</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>From Branch</th>
                  <th>To Branch</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.map((transfer) => (
                  <tr key={transfer._id}>
                    <td>
                      {new Date(transfer.requestDate).toLocaleDateString()}
                    </td>
                    <td>{transfer.fromBranch_id?.branch_name || "N/A"}</td>
                    <td>{transfer.toBranch_id?.branch_name || "N/A"}</td>
                    <td>
                      {transfer.item_id?.name || "N/A"} (
                      {transfer.item_id?.category || "N/A"})
                    </td>
                    <td>{transfer.quantity}</td>
                    <td>
                      <span
                        className={`badge-${transfer.status === "completed" ? "success" : transfer.status === "rejected" ? "danger" : "warning"}`}
                      >
                        {transfer.status}
                      </span>
                    </td>
                    <td>
                      {transfer.status === "pending" &&
                        String(transfer.fromBranch_id?._id) ===
                          String(branchId) && (
                          <>
                            <button
                              onClick={() => handleApproveTransfer(transfer._id)}
                              className="btn-small btn-success"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectTransfer(transfer._id)}
                              className="btn-small btn-danger"
                            >
                              Reject
                            </button>
                          </>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTransfers.length === 0 && (
              <div className="empty-state">No transfers found</div>
            )}
          </div>
        </div>
      )}

      {/* Adjustments Tab */}
      {activeTab === "adjustment" && (
        <div className="inventory-content">
          <form onSubmit={handleAdjustmentSubmit} className="adjustment-form">
            <h3>Record Adjustment</h3>
            <div className="form-grid">
              <div>
                <label>Item *</label>
                <select
                  value={adjustmentForm.item_id}
                  onChange={(e) =>
                    setAdjustmentForm({
                      ...adjustmentForm,
                      item_id: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select item</option>
                  {items.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} ({item.category}) - Stock: {item.currentStock}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Quantity Change *</label>
                <input
                  type="number"
                  value={adjustmentForm.quantity}
                  onChange={(e) =>
                    setAdjustmentForm({
                      ...adjustmentForm,
                      quantity: e.target.value,
                    })
                  }
                  required
                  placeholder="Negative for reduction"
                />
                <small>Use negative value for reductions (e.g., -5)</small>
              </div>
              <div>
                <label>Reason *</label>
                <select
                  value={adjustmentForm.reason}
                  onChange={(e) =>
                    setAdjustmentForm({
                      ...adjustmentForm,
                      reason: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">Select reason</option>
                  <option value="damage">Damage</option>
                  <option value="expiry">Expiry</option>
                  <option value="disposal">Disposal</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label>Description</label>
                <input
                  type="text"
                  value={adjustmentForm.description}
                  onChange={(e) =>
                    setAdjustmentForm({
                      ...adjustmentForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <button type="submit" className="btn-primary">
              Record Adjustment
            </button>
          </form>

          <div className="adjustments-list">
            <h3>Adjustment History</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Quantity Change</th>
                  <th>Reason</th>
                  <th>Description</th>
                  <th>Adjusted By</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.slice(0, 20).map((adjustment) => (
                  <tr key={adjustment._id}>
                    <td>
                      {new Date(adjustment.adjustmentDate).toLocaleDateString()}
                    </td>
                    <td>
                      {adjustment.item_id?.name || "N/A"} (
                      {adjustment.item_id?.category || "N/A"})
                    </td>
                    <td
                      className={
                        adjustment.quantity > 0 ? "positive" : "negative"
                      }
                    >
                      {adjustment.quantity > 0 ? "+" : ""}
                      {adjustment.quantity}
                    </td>
                    <td>{adjustment.reason}</td>
                    <td>{adjustment.description || "-"}</td>
                    <td>{adjustment.adjustedBy?.name || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {adjustments.length === 0 && (
              <div className="empty-state">No adjustments recorded</div>
            )}
          </div>
        </div>
      )}

      {/* Opening Stock Tab */}
      {activeTab === "opening" && (
        <div className="inventory-content">
          <form onSubmit={handleOpeningStockSubmit} className="opening-stock-form">
            <h3>Set Opening Stock</h3>
            <p>Set initial quantities for items at the start of the academic year.</p>
            <div className="opening-stock-list">
              {openingStockForm.map((row, index) => (
                <div key={index} className="opening-stock-row">
                  <select
                    value={row.item_id}
                    onChange={(e) =>
                      updateOpeningStockRow(index, "item_id", e.target.value)
                    }
                    required
                  >
                    <option value="">Select item</option>
                    {items.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} ({item.category})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={row.quantity}
                    onChange={(e) =>
                      updateOpeningStockRow(index, "quantity", e.target.value)
                    }
                    placeholder="Quantity"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeOpeningStockRow(index)}
                    className="btn-small btn-danger"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button
                type="button"
                onClick={addOpeningStockRow}
                className="btn-secondary"
              >
                Add Item
              </button>
              <button type="submit" className="btn-primary">
                Set Opening Stock
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div className="inventory-content">
          <div className="reports-section">
            <h3>Current Stock Report</h3>
            <div className="category-groups">
              {Object.entries(
                items.reduce((acc, item) => {
                  if (!acc[item.category]) {
                    acc[item.category] = [];
                  }
                  acc[item.category].push(item);
                  return acc;
                }, {})
              ).map(([category, categoryItems]) => (
                <div key={category} className="category-group">
                  <h4>
                    {category.charAt(0).toUpperCase() +
                      category.slice(1).replace("_", " ")}{" "}
                    ({categoryItems.length} items)
                  </h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Current Stock</th>
                        <th>Min Quantity</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryItems.map((item) => (
                        <tr
                          key={item._id}
                          className={item.isLowStock ? "low-stock" : ""}
                        >
                          <td>{item.name}</td>
                          <td>{item.currentStock}</td>
                          <td>{item.minQuantity}</td>
                          <td>
                            {item.isLowStock ? (
                              <span className="badge-warning">Low Stock</span>
                            ) : (
                              <span className="badge-success">OK</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

