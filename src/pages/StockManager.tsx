import React, { useState } from 'react';
import { Package, Edit3, AlertTriangle, CheckCircle, XCircle, Plus, Save, X } from 'lucide-react';
import { Stock, StockItem } from '../types';
import { getStockStatus } from '../utils/dataManager';

interface StockManagerProps {
  stock: Stock;
  onUpdateStock: (stock: Stock) => Promise<void> | void;
}

const StockManager: React.FC<StockManagerProps> = ({ stock, onUpdateStock }) => {
  const [editingItem, setEditingItem] = useState<{ category: 'groceries' | 'vegetables'; name: string } | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editThreshold, setEditThreshold] = useState('');
  const [addingItem, setAddingItem] = useState<'groceries' | 'vegetables' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [newItemThreshold, setNewItemThreshold] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-stock':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'low-stock':
        return <AlertTriangle size={16} className="text-amber-400" />;
      case 'out-of-stock':
        return <XCircle size={16} className="text-red-400" />;
      default:
        return <CheckCircle size={16} className="text-green-400" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'status-green';
      case 'low-stock':
        return 'status-amber';
      case 'out-of-stock':
        return 'status-red';
      default:
        return 'status-green';
    }
  };

  const handleEditStart = (category: 'groceries' | 'vegetables', name: string, item: StockItem) => {
    setEditingItem({ category, name });
    setEditQuantity(item.quantity.toString());
    setEditThreshold((item.threshold || 0).toString());
  };

  const handleEditSave = () => {
    if (!editingItem) return;

    const { category, name } = editingItem;
    const newStock = { ...stock };
    
    newStock[category][name] = {
      ...newStock[category][name],
      quantity: parseFloat(editQuantity) || 0,
      threshold: parseFloat(editThreshold) || 0
    };

    onUpdateStock(newStock);
    setEditingItem(null);
    setEditQuantity('');
    setEditThreshold('');
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditQuantity('');
    setEditThreshold('');
  };

  const handleAddItem = () => {
    if (!addingItem || !newItemName.trim()) {
      alert('Please enter a valid item name');
      return;
    }

    const quantity = parseFloat(newItemQuantity);
    const threshold = newItemThreshold ? parseFloat(newItemThreshold) : undefined;

    if (isNaN(quantity) || quantity < 0) {
      alert('Please enter a valid quantity');
      return;
    }

    const newStock = { ...stock };
    const itemKey = newItemName.toLowerCase().replace(/\s+/g, '_');
    
    // Check if item already exists
    if (newStock[addingItem][itemKey]) {
      alert('Item already exists! Use edit to modify existing items.');
      return;
    }

    newStock[addingItem][itemKey] = {
      unit: newItemUnit,
      quantity,
      threshold
    };

    onUpdateStock(newStock);
    
    // Reset form
    setAddingItem(null);
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemUnit('kg');
    setNewItemThreshold('');
  };

  const handleCancelAdd = () => {
    setAddingItem(null);
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemUnit('kg');
    setNewItemThreshold('');
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(stock, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedStock = JSON.parse(e.target?.result as string);
        
        // Validate structure
        if (!importedStock.groceries || !importedStock.vegetables) {
          alert('Invalid stock file format');
          return;
        }

        const confirmImport = window.confirm(
          'This will replace all current stock data. Are you sure?'
        );

        if (confirmImport) {
          onUpdateStock(importedStock);
          alert('Stock data imported successfully!');
        }
      } catch (error) {
        alert('Error reading file. Please ensure it\'s a valid JSON file.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const formatItemName = (name: string) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderStockSection = (title: string, items: { [key: string]: StockItem }, category: 'groceries' | 'vegetables') => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <Package className="mr-2 text-accent-400" size={20} />
          {title}
        </h2>
        <button
          onClick={() => setAddingItem(category)}
          className="btn-primary text-sm flex items-center"
        >
          <Plus size={16} className="mr-1" />
          Add Item
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {/* Add Item Form */}
        {addingItem === category && (
          <div className="card border-accent-500 bg-accent-500/10">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Item name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="input-field w-full text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                  className="input-field text-sm"
                  min="0"
                  step="0.1"
                />
                <select
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="select-field text-sm"
                >
                  <option value="kg">kg</option>
                  <option value="grams">grams</option>
                  <option value="pieces">pieces</option>
                  <option value="bundles">bundles</option>
                  <option value="ml">ml</option>
                  <option value="liters">liters</option>
                </select>
              </div>
              <input
                type="number"
                placeholder="Threshold (optional)"
                value={newItemThreshold}
                onChange={(e) => setNewItemThreshold(e.target.value)}
                className="input-field w-full text-sm"
                min="0"
                step="0.1"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleAddItem}
                  className="flex-1 bg-accent-500 hover:bg-accent-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center"
                >
                  <Save size={14} className="mr-1" />
                  Save
                </button>
                <button
                  onClick={handleCancelAdd}
                  className="flex-1 bg-primary-600 hover:bg-primary-500 text-white px-3 py-2 rounded text-sm flex items-center justify-center"
                >
                  <X size={14} className="mr-1" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {Object.entries(items).map(([name, item]) => {
          const status = getStockStatus(item);
          const isEditing = editingItem?.category === category && editingItem?.name === name;
          
          return (
            <div key={name} className={`card relative ${getStatusClass(status)}`}>
              <div className="flex items-center justify-between mb-2">
                {getStatusIcon(status)}
                {!isEditing && (
                  <button
                    onClick={() => handleEditStart(category, name, item)}
                    className="p-1 hover:bg-primary-600 rounded transition-colors"
                    title="Edit stock"
                  >
                    <Edit3 size={14} className="text-primary-400 hover:text-accent-400" />
                  </button>
                )}
              </div>
              
              <h3 className="font-medium text-sm mb-2 leading-tight">
                {formatItemName(name)}
              </h3>
              
              {isEditing ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-primary-300 block mb-1">Quantity</label>
                    <input
                      type="number"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                      className="input-field w-full text-xs py-1"
                      step="0.1"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-primary-300 block mb-1">Threshold</label>
                    <input
                      type="number"
                      value={editThreshold}
                      onChange={(e) => setEditThreshold(e.target.value)}
                      className="input-field w-full text-xs py-1"
                      step="0.1"
                      min="0"
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={handleEditSave}
                      className="btn-primary text-xs py-1 px-2 flex-1"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="btn-secondary text-xs py-1 px-2 flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-lg font-bold mb-1">
                    {item.quantity} <span className="text-xs text-primary-300">{item.unit}</span>
                  </div>
                  <div className="text-xs text-primary-400">
                    Low at: {item.threshold || 0} {item.unit}
                  </div>
                  {status === 'low-stock' && (
                    <div className="text-xs text-amber-400 mt-1 font-medium">
                      Running Low!
                    </div>
                  )}
                  {status === 'out-of-stock' && (
                    <div className="text-xs text-red-400 mt-1 font-medium">
                      Out of Stock!
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-primary-900 p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Stock Manager</h1>
          <p className="text-primary-300">Monitor and update your inventory levels</p>
        </div>
        
        {/* Import/Export Controls */}
        <div className="flex items-center space-x-3">
          <input
            type="file"
            accept=".json"
            onChange={importFromJSON}
            className="hidden"
            id="import-stock"
          />
          <label
            htmlFor="import-stock"
            className="btn-secondary text-sm cursor-pointer"
          >
            📥 Import
          </label>
          <button
            onClick={exportToJSON}
            className="btn-secondary text-sm"
          >
            📤 Export
          </button>
        </div>
      </div>

      {renderStockSection('Vegetables', stock.vegetables, 'vegetables')}
      {renderStockSection('Groceries', stock.groceries, 'groceries')}

      {/* Stock Summary */}
      <div className="card mt-8">
        <h3 className="text-lg font-semibold text-white mb-3">Stock Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-400">
              {Object.values({ ...stock.groceries, ...stock.vegetables })
                .filter(item => getStockStatus(item) === 'in-stock').length}
            </div>
            <div className="text-sm text-primary-300">In Stock</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">
              {Object.values({ ...stock.groceries, ...stock.vegetables })
                .filter(item => getStockStatus(item) === 'low-stock').length}
            </div>
            <div className="text-sm text-primary-300">Low Stock</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400">
              {Object.values({ ...stock.groceries, ...stock.vegetables })
                .filter(item => getStockStatus(item) === 'out-of-stock').length}
            </div>
            <div className="text-sm text-primary-300">Out of Stock</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockManager;