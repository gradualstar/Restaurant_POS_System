import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { MdSearch, MdDelete, MdEdit, MdSettings } from "react-icons/md";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    fetchOrders();
    
    // Optional: Real-time subscription to see new orders instantly
    const subscription = supabase
      .channel('orders_channel')
      .on('postgres_changes', { event: '*', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setOrders(data || []);
    setLoading(false);
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm("Delete this order?")) {
      await supabase.from('orders').delete().eq('id', id);
      fetchOrders();
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white font-bold tracking-widest uppercase text-xs">Syncing CosyPOS...</div>;

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      
      {/* 1. SIDEBAR (Exact copy from your Menu code) */}
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
        {/* Header */}
        <header className="p-10 flex justify-between items-center">
          <div className="relative w-80">
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
            <input type="text" placeholder="Search" className="w-full bg-[#151515] border-none rounded-xl py-2.5 pl-12 text-sm text-white outline-none" />
          </div>
          <div className="flex gap-3">
            <button className="bg-[#151515] border border-white/5 rounded-xl px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              Current <MdSettings size={14}/>
            </button>
            <button className="bg-[#151515] border border-white/5 rounded-xl px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest">
              Layout of halls
            </button>
          </div>
        </header>

        {/* Orders Grid */}
        <div className="flex-1 overflow-y-auto px-10 pb-10">
          <h1 className="text-4xl font-bold mb-8">Orders</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-[#151515] p-6 rounded-[2.5rem] border border-white/5 flex flex-col min-h-[450px]">
                
                {/* Table ID & Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-[#4ade80] mb-1">{order.table_number}</h3>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{order.waiter_name}</p>
                  </div>
                  <span className="text-[10px] text-gray-700 font-bold">#{order.id.toString().slice(0, 4)}</span>
                </div>

                {/* Items Table */}
                <div className="flex-1">
                  <div className="grid grid-cols-6 text-[9px] uppercase font-bold text-gray-600 border-b border-white/5 pb-2 mb-4 tracking-widest">
                    <span className="col-span-1">Qt</span>
                    <span className="col-span-3">Items</span>
                    <span className="col-span-2 text-right">Price</span>
                  </div>

                  <div className="space-y-4">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-6 text-xs font-medium">
                        <span className="col-span-1 text-gray-500">{item.quantity}</span>
                        <span className="col-span-3 text-gray-200">{item.name}</span>
                        <span className="col-span-2 text-right text-gray-400">KSh {item.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer / Total / Actions */}
                <div className="mt-8 pt-6 border-t border-dashed border-gray-800">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total</span>
                    <span className="text-xl font-bold">KSh {order.total_price.toLocaleString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleDeleteOrder(order.id)}
                      className="w-12 h-12 bg-[#1a1a1a] border border-white/5 rounded-2xl flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <MdDelete size={20}/>
                    </button>
                    <button className="w-12 h-12 bg-[#1a1a1a] border border-white/5 rounded-2xl flex items-center justify-center text-gray-500 hover:text-white transition-colors">
                      <MdEdit size={20}/>
                    </button>
                    <button className="flex-1 bg-[#252525] text-white py-3.5 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#303030] transition-colors">
                      Payment
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Orders;