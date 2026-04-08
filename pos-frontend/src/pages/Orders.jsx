import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { MdSearch, MdSettings, MdDelete, MdEdit, MdClose, MdBackspace, MdCheckCircle } from "react-icons/md";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("current"); 
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState("0.00");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const location = useLocation();

  useEffect(() => {
    fetchOrders();
    const subscription = supabase
      .channel('orders_realtime')
      .on('postgres_changes', { event: '*', table: 'orders' }, () => fetchOrders())
      .subscribe();
    return () => supabase.removeChannel(subscription);
  }, [viewMode]);

  const fetchOrders = async () => {
    setLoading(true);
    let query = supabase.from('orders').select('*');
    
    if (viewMode === "current") {
      // Pulls everything that isn't 'completed'
      query = query.neq('status', 'completed');
    } else {
      query = query.eq('status', 'completed');
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error) setOrders(data || []);
    setLoading(false);
  };

  const handleApplyPayment = async () => {
    if (!selectedOrder) return;

    // CHANGED: Using 'id' instead of 'uuid' to match standard Supabase primary keys
    const { error } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', selectedOrder.id); 

    if (error) {
      console.error("Update failed:", error);
      alert(`Update failed: ${error.message}. Try changing 'id' to the actual primary key name in your table.`);
    } else {
      setIsPaymentOpen(false);
      fetchOrders();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete order?")) {
      await supabase.from('orders').delete().eq('id', id);
      fetchOrders();
    }
  };

  const handleKeypadPress = (val) => {
    if (tipAmount === "0.00") setTipAmount(val);
    else setTipAmount(prev => prev + val);
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-[10px] uppercase font-bold tracking-widest">Syncing...</div>;

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden relative">
      <aside className="w-60 border-r border-gray-900 flex flex-col p-6 bg-[#0a0a0a] flex-shrink-0">
        <div className="flex items-center gap-2 mb-10">
            <div className="w-5 h-1 flex flex-col gap-1"><div className="w-full h-0.5 bg-white"></div><div className="w-full h-0.5 bg-white"></div></div>
            <span className="text-lg font-bold tracking-tight">CosyPOS</span>
        </div>
        <nav className="flex-1 space-y-1">
          {["Menu", "Orders", "Reservation", "Chat", "Dashboard", "Accounting", "Settings"].map((name) => (
            <Link key={name} to={`/${name.toLowerCase()}`} className={`block px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${location.pathname === `/${name.toLowerCase()}` ? "bg-[#1a1a1a] text-white" : "text-gray-500 hover:text-gray-300"}`}>{name}</Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-8 py-6 flex justify-between items-center">
          <div className="relative w-72">
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
            <input type="text" placeholder="Search..." className="w-full bg-[#121212] border-none rounded-xl py-2 pl-11 text-[13px] text-white outline-none" />
          </div>
          <div className="bg-[#121212] border border-gray-800 rounded-xl p-1 flex">
            <button onClick={() => setViewMode("current")} className={`px-6 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${viewMode === "current" ? "bg-[#1a1a1a] text-white" : "text-gray-500"}`}>Current</button>
            <button onClick={() => setViewMode("completed")} className={`px-6 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${viewMode === "completed" ? "bg-[#1a1a1a] text-white" : "text-gray-500"}`}>Completed</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <h1 className="text-3xl font-bold mb-1">{viewMode === "current" ? "Active" : "History"}</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-[#1a1a1a] p-5 rounded-[2rem] border border-gray-800/50 flex flex-col min-h-[350px]">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-[#4ade80]">Table {order.table_number || "A1"}</h3>
                    <p className="text-[8px] text-gray-600 uppercase font-bold">{order.waiter_name || "Staff"}</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[10px] mb-2 font-medium">
                      <span className="text-gray-300">{item.quantity}x {item.name}</span>
                      <span className="text-gray-400">KSh {item.price?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-dashed border-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[9px] text-gray-600 font-bold uppercase">Total</span>
                    <span className="text-base font-bold">KSh {order.total_price?.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {viewMode === "current" ? (
                      <>
                        <button onClick={() => handleDelete(order.id)} className="w-9 h-9 bg-[#222] rounded-xl flex items-center justify-center text-gray-500 hover:text-red-500"><MdDelete/></button>
                        <button onClick={() => { setSelectedOrder(order); setIsPaymentOpen(true); }} className="flex-1 bg-white text-black py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all">Process Payment</button>
                      </>
                    ) : (
                      <div className="w-full py-2.5 bg-emerald-950/20 text-emerald-500 rounded-xl flex items-center justify-center gap-2 text-[9px] font-bold uppercase"><MdCheckCircle/> Completed</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* PAYMENT MODAL */}
      {isPaymentOpen && selectedOrder && (
        <div className="absolute inset-0 bg-black/95 flex z-50">
          <div className="w-[320px] border-r border-gray-900 p-8 flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-bold">Table {selectedOrder.table_number}</h2>
              <button onClick={() => setIsPaymentOpen(false)} className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center"><MdClose/></button>
            </div>
            <div className="flex-1 space-y-4">
                <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>KSh {selectedOrder.total_price?.toLocaleString()}</span></div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                    <span className="text-sm font-bold text-gray-400">Total</span>
                    <span className="text-3xl font-bold">KSh {(selectedOrder.total_price + parseFloat(tipAmount)).toLocaleString()}</span>
                </div>
            </div>
            <div className="mt-10 flex gap-2">
                {["Cash", "Card", "MPesa"].map(m => (
                    <button key={m} onClick={() => setPaymentMethod(m)} className={`flex-1 py-3 rounded-xl border text-[9px] font-bold uppercase transition-all ${paymentMethod === m ? "bg-white text-black" : "text-gray-600 border-gray-800"}`}>{m}</button>
                ))}
            </div>
          </div>
          <div className="flex-1 bg-[#0d0d0d] p-10 flex flex-col items-center justify-center">
            <p className="text-[10px] text-gray-600 uppercase font-bold mb-6 tracking-widest">Tip Amount</p>
            <div className="text-7xl font-bold mb-12 tabular-nums">{tipAmount}</div>
            <div className="grid grid-cols-3 gap-3 w-full max-w-[320px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map(val => (
                    <button key={val} onClick={() => handleKeypadPress(val.toString())} className="h-16 bg-gray-900 border border-gray-800 rounded-2xl text-xl font-bold hover:bg-gray-800">{val}</button>
                ))}
                <button onClick={() => setTipAmount("0.00")} className="h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center text-gray-500"><MdBackspace size={22}/></button>
            </div>
            <button onClick={handleApplyPayment} className="mt-12 w-full max-w-[320px] bg-white text-black py-5 rounded-[2rem] text-xs font-bold uppercase hover:bg-emerald-400 transition-all shadow-xl">Complete Payment</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;