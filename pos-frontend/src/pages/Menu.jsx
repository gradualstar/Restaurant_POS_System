import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { MdSearch, MdAdd, MdRemove, MdClose, MdEdit } from "react-icons/md";

const Menu = () => {
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [orderItems, setOrderItems] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState("Table 1");
  const [selectedStaff, setSelectedStaff] = useState("Leslie K.");
  const location = useLocation();

  const [newDish, setNewDish] = useState({ name: "", price: "", category_id: "", image_url: "" });

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    setLoading(true);
    const { data: catData } = await supabase.from('categories').select('*');
    const { data: dishData } = await supabase.from('dishes').select('*');
    setCategories(catData || []);
    setDishes(dishData || []);
    if (catData?.length > 0 && !selectedCategory) setSelectedCategory(catData[0].id);
    setLoading(false);
  };

  const handleAddDish = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('dishes')
      .insert([{ ...newDish, price: parseFloat(newDish.price) }]);

    if (error) {
        alert("Error: " + error.message);
    } else {
        setIsModalOpen(false);
        fetchMenuData();
        setNewDish({ name: "", price: "", category_id: "", image_url: "" });
    }
  };

  // Logic to save order to Supabase
  const handlePlaceOrder = async () => {
    if (orderItems.length === 0) {
      alert("Please add items to the order first!");
      return;
    }

    const { error } = await supabase
      .from('orders')
      .insert([
        {
          table_number: selectedTable,
          waiter_name: selectedStaff,
          items: orderItems,
          subtotal: subtotal,
          tax: tax,
          total_price: total,
          status: 'pending'
        }
      ]);

    if (error) {
      alert("Error placing order: " + error.message);
    } else {
      alert(`Order for ${selectedTable} placed successfully!`);
      setOrderItems([]); // Reset sidebar after success
    }
  };

  const updateQuantity = (dish, delta) => {
    setOrderItems(prev => {
      const existing = prev.find(item => item.id === dish.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) return prev.filter(item => item.id !== dish.id);
        return prev.map(item => item.id === dish.id ? { ...item, quantity: newQty } : item);
      }
      if (delta > 0) return [...prev, { ...dish, quantity: 1 }];
      return prev;
    });
  };

  const subtotal = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white font-bold tracking-widest uppercase text-xs">Syncing CosyPOS...</div>;

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      {/* 1. SIDEBAR */}
      <aside className="w-64 border-r border-gray-900 flex flex-col p-8 bg-[#0a0a0a] flex-shrink-0">
        <div className="flex items-center gap-2 mb-12">
            <div className="w-6 h-1 flex flex-col gap-1">
                <div className="w-full h-0.5 bg-white"></div>
                <div className="w-full h-0.5 bg-white"></div>
            </div>
            <span className="text-xl font-bold tracking-tight">CosyPOS</span>
        </div>
        
        <nav className="flex-1 space-y-1">
          {[
            { name: "Menu", path: "/menu" },
            { name: "Orders", path: "/orders" },
            { name: "Reservation", path: "/reservation" },
            { name: "Chat", path: "/chat" },
            { name: "Dashboard", path: "/dashboard" },
            { name: "Accounting", path: "/accounting" },
            { name: "Settings", path: "/settings" }
          ].map((item) => (
            <Link key={item.name} to={item.path}
              className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                location.pathname === item.path ? "bg-[#252525] text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 2. MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="p-10 flex justify-between items-center">
          <div className="relative w-80">
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
            <input type="text" placeholder="Search" className="w-full bg-[#151515] border-none rounded-xl py-2.5 pl-12 text-sm text-white outline-none" />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10">
            <MdAdd size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-10 pb-10">
          {/* Categories */}
          <div className="grid grid-cols-4 gap-4 mb-10">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{ backgroundColor: cat.color }}
                className={`p-6 rounded-[2rem] flex flex-col items-start gap-4 transition-all border-4 ${selectedCategory === cat.id ? 'border-white scale-[1.02] text-black' : 'border-transparent text-black/80 hover:opacity-90'}`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <div className="text-left">
                  <p className="font-bold text-sm leading-tight">{cat.name}</p>
                  <p className="text-[10px] opacity-60">
                    {dishes.filter(d => d.category_id === cat.id).length} items
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Dishes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dishes.filter(d => d.category_id === selectedCategory).map((dish) => {
              const currentItem = orderItems.find(item => item.id === dish.id);
              const isHighlighted = !!currentItem;
              const catColor = categories.find(c => c.id === dish.category_id)?.color || '#fff';
              
              return (
                <div 
                  key={dish.id} 
                  onClick={() => updateQuantity(dish, 1)}
                  style={{ backgroundColor: isHighlighted ? catColor : '#1a1a1a' }}
                  className={`p-8 rounded-[2.5rem] border border-white/5 relative transition-all cursor-pointer flex flex-col min-h-[220px] ${isHighlighted ? 'text-black' : 'text-white hover:border-white/20'}`}
                >
                  <span className={`text-[9px] uppercase tracking-widest font-bold mb-4 ${isHighlighted ? 'text-black/50' : 'text-gray-600'}`}>Orders → Kitchen</span>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-2 leading-tight break-words">{dish.name}</h3>
                    <p className={`font-bold text-lg ${isHighlighted ? 'text-black' : 'text-[#b4b4ff]'}`}>KSh {dish.price.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateQuantity(dish, -1); }}
                      className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors ${isHighlighted ? 'border-black/20 text-black' : 'border-gray-800 text-gray-400 hover:bg-gray-800'}`}>
                      <MdRemove size={20}/>
                    </button>
                    <span className="font-bold text-xl">{currentItem?.quantity || 0}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateQuantity(dish, 1); }}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-105 transition-transform shadow-lg ${isHighlighted ? 'bg-black text-white' : 'bg-white text-black'}`}
                    >
                      <MdAdd size={20}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 3. ORDER SIDEBAR */}
      <aside className="w-[400px] bg-[#0a0a0a] border-l border-gray-900 flex flex-col flex-shrink-0 p-8">
        <div className="space-y-4 mb-10">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Select Table</label>
            <select 
              value={selectedTable} 
              onChange={(e) => setSelectedTable(e.target.value)}
              className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2 text-white outline-none focus:border-[#b4b4ff]"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => <option key={num} value={`Table ${num}`}>Table {num}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Taken By</label>
            <select 
              value={selectedStaff} 
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2 text-white outline-none focus:border-[#b4b4ff]"
            >
              {['Leslie K.', 'Cameron W.', 'Jacob J.'].map(staff => <option key={staff} value={staff}>{staff}</option>)}
            </select>
          </div>
        </div>

        {/* Dynamic Order List */}
        <div className="flex-1 overflow-y-auto space-y-3">
            {orderItems.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-4 border border-white/5 opacity-50">🍽️</div>
                    <p className="text-gray-500 text-sm">Select items from the menu<br/>to start a new order</p>
                </div>
            ) : (
                orderItems.map((item, index) => (
                    <div key={item.id} className="bg-[#151515] p-4 rounded-2xl flex justify-between items-center border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-[#b4b4ff]">
                                {index + 1}
                            </div>
                            <div>
                                <p className="text-sm font-bold">{item.name} <span className="text-gray-500 text-xs">x{item.quantity}</span></p>
                                <p className="text-[10px] text-gray-500 uppercase">KSh {item.price.toLocaleString()}</p>
                            </div>
                        </div>
                        <p className="font-bold text-sm">KSh {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                ))
            )}
        </div>

        <div className="pt-8 border-t border-gray-900 space-y-4 mt-6">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal</span>
            <span className="text-white">KSh {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Tax 10%</span>
            <span className="text-white">KSh {tax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-2xl font-bold pt-2 border-t border-dashed border-gray-800">
            <span>Total</span>
            <span>KSh {total.toLocaleString()}</span>
          </div>
          
          <button 
            onClick={handlePlaceOrder}
            className="w-full py-4 mt-6 bg-white text-black rounded-2xl font-bold hover:bg-gray-200 transition-colors active:scale-95"
          >
            Place Order
          </button>
        </div>
      </aside>

      {/* NEW DISH MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#151515] w-full max-w-md rounded-[2.5rem] p-8 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">New Dish</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><MdClose size={24}/></button>
            </div>
            <form onSubmit={handleAddDish} className="space-y-6">
              <input required className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-3.5 px-4 outline-none focus:border-[#b4b4ff] text-sm" placeholder="Dish Name" onChange={(e) => setNewDish({...newDish, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" step="0.01" className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-3.5 px-4 outline-none focus:border-[#b4b4ff] text-sm" placeholder="Price" onChange={(e) => setNewDish({...newDish, price: e.target.value})} />
                <select required className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-3.5 px-4 outline-none focus:border-[#b4b4ff] text-sm" onChange={(e) => setNewDish({...newDish, category_id: e.target.value})}>
                  <option value="">Category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-[#b4b4ff] text-black py-4 rounded-2xl font-bold mt-4 hover:scale-[1.02] transition-transform">Save Dish</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;