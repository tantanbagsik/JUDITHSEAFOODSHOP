'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Plus, GripVertical, Trash2, Save, ChevronDown, ChevronRight, Edit2 } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  type: 'link' | 'category' | 'product' | 'external';
  url?: string;
  children?: MenuItem[];
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export default function MenuPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.storeId) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [menuRes, categoriesRes] = await Promise.all([
        fetch(`/api/stores/${session?.user?.storeId}/menu?storeId=${session?.user?.storeId}`),
        fetch(`/api/stores/${session?.user?.storeId}/categories?storeId=${session?.user?.storeId}`),
      ]);

      const menuData = await menuRes.json();
      const categoriesData = await categoriesRes.json();

      if (menuData?.items) {
        setMenuItems(menuData.items);
      }
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMenuItem = (parentId?: string) => {
    const newItem: MenuItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: 'New Menu Item',
      type: 'link',
      url: '/',
    };

    if (parentId) {
      setMenuItems(prevItems => {
        return prevItems.map(item => {
          if (item.id === parentId) {
            return { ...item, children: [...(item.children || []), newItem] };
          }
          if (item.children) {
            return { ...item, children: addToChildren(item.children, parentId, newItem) };
          }
          return item;
        });
      });
      setExpandedItems(prev => new Set([...prev, parentId]));
    } else {
      setMenuItems(prevItems => [...prevItems, newItem]);
    }
  };

  const addToChildren = (items: MenuItem[], parentId: string, newItem: MenuItem): MenuItem[] => {
    return items.map(item => {
      if (item.id === parentId) {
        return { ...item, children: [...(item.children || []), newItem] };
      }
      if (item.children) {
        return { ...item, children: addToChildren(item.children, parentId, newItem) };
      }
      return item;
    });
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems(prevItems => updateInList(prevItems, id, updates));
  };

  const updateInList = (items: MenuItem[], id: string, updates: Partial<MenuItem>): MenuItem[] => {
    return items.map(item => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      if (item.children) {
        return { ...item, children: updateInList(item.children, id, updates) };
      }
      return item;
    });
  };

  const removeMenuItem = (id: string) => {
    setMenuItems(prevItems => removeFromList(prevItems, id));
  };

  const removeFromList = (items: MenuItem[], id: string): MenuItem[] => {
    return items
      .filter(item => item.id !== id)
      .map(item => ({
        ...item,
        children: item.children ? removeFromList(item.children, id) : undefined,
      }));
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    if (draggedItem !== itemId) {
      setDragOverItem(itemId);
    }
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverItem(null);

    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      return;
    }

    const itemToMove = findItem(menuItems, draggedItem);
    if (!itemToMove) {
      setDraggedItem(null);
      return;
    }

    setMenuItems(prevItems => {
      const withoutMoved = removeFromList(prevItems, draggedItem);
      return insertAfter(withoutMoved, targetId, itemToMove);
    });

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const findItem = (items: MenuItem[], id: string): MenuItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItem(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const insertAfter = (items: MenuItem[], targetId: string, newItem: MenuItem): MenuItem[] => {
    const result: MenuItem[] = [];
    for (const item of items) {
      result.push(item);
      if (item.id === targetId) {
        result.push(newItem);
      }
      if (item.children) {
        result[result.length - 1] = {
          ...item,
          children: insertAfter(item.children, targetId, newItem),
        };
      }
    }
    return result;
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isDragging = draggedItem === item.id;
    const isDropTarget = dragOverItem === item.id;

    return (
      <div key={item.id} className="relative">
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item.id)}
          onDragEnd={handleDragEnd}
          className={`
            flex items-center gap-2 p-3 border rounded-lg mb-2 bg-white
            ${isDragging ? 'opacity-50' : ''}
            ${isDropTarget ? 'border-blue-500 border-2' : 'border-gray-200'}
            ${level > 0 ? 'ml-6' : ''}
          `}
          style={{ marginLeft: level * 24 }}
        >
          <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
          
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(item.id)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}

          {editingItem === item.id ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={item.label}
                onChange={(e) => updateMenuItem(item.id, { label: e.target.value })}
                className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <select
                value={item.type}
                onChange={(e) => updateMenuItem(item.id, { type: e.target.value as any })}
                className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="link">Link</option>
                <option value="category">Category</option>
                <option value="product">Product</option>
                <option value="external">External</option>
              </select>
              <input
                type="text"
                value={item.url || ''}
                onChange={(e) => updateMenuItem(item.id, { url: e.target.value })}
                className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="URL"
              />
              <button
                onClick={() => setEditingItem(null)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 flex items-center gap-3">
                <span className="font-medium">{item.label}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                  {item.type}
                </span>
                <span className="text-sm text-gray-400 truncate flex-1">
                  {item.url || '/'}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => addMenuItem(item.id)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded"
                  title="Add submenu"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setEditingItem(item.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => removeMenuItem(item.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/stores/${session?.user?.storeId}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: menuItems }),
      });

      if (res.ok) {
        alert('Menu saved successfully!');
      } else {
        alert('Failed to save menu');
      }
    } catch (error) {
      console.error('Failed to save menu:', error);
      alert('Failed to save menu');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Builder</h1>
          <p className="text-sm text-gray-500 mt-1">
            Drag items to reorder. Click edit to customize.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => addMenuItem()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Menu'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Menu Structure</h2>
            
            {menuItems.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 mb-4">No menu items yet</p>
                <button
                  onClick={() => addMenuItem()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add your first menu item
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {menuItems.map(item => renderMenuItem(item))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white shadow rounded-lg p-6 sticky top-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Add</h2>
            <div className="space-y-2">
              <button
                onClick={() => {
                  addMenuItem();
                  setEditingItem(menuItems[menuItems.length - 1]?.id || '');
                }}
                className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium">Link</div>
                <div className="text-sm text-gray-500">Internal page link</div>
              </button>
              <button
                onClick={() => {
                  const newItem = {
                    id: `item-${Date.now()}`,
                    label: 'New Category',
                    type: 'category' as const,
                    url: '/category/new',
                  };
                  setMenuItems([...menuItems, newItem]);
                }}
                className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium">Category Page</div>
                <div className="text-sm text-gray-500">Link to a product category</div>
              </button>
              <button
                onClick={() => {
                  const newItem = {
                    id: `item-${Date.now()}`,
                    label: 'New Product',
                    type: 'product' as const,
                    url: '/product/new',
                  };
                  setMenuItems([...menuItems, newItem]);
                }}
                className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium">Product Page</div>
                <div className="text-sm text-gray-500">Link to a specific product</div>
              </button>
              <button
                onClick={() => {
                  const newItem = {
                    id: `item-${Date.now()}`,
                    label: 'External Link',
                    type: 'external' as const,
                    url: 'https://',
                  };
                  setMenuItems([...menuItems, newItem]);
                }}
                className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="font-medium">External URL</div>
                <div className="text-sm text-gray-500">Link to another website</div>
              </button>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Categories</h3>
              <div className="space-y-1">
                {categories.map(cat => (
                  <button
                    key={cat._id}
                    onClick={() => {
                      setMenuItems([...menuItems, {
                        id: `item-${Date.now()}`,
                        label: cat.name,
                        type: 'category',
                        url: `/category/${cat.slug}`,
                      }]);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                  >
                    + {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
