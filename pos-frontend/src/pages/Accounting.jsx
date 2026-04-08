import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { MdSearch, MdReceipt, MdInventory, MdTrendingUp, MdAdd, MdClose, MdHistory, MdArrowForward } from "react-icons/md";

const Accounting = () => {
  const [viewMode, setViewMode] = useState("monthly"); 
  const [activeTab, setActiveTab] = useState("overview"); 
  const [expenses, setExpenses] = useState([]);
  const [stockHistory, setStockHistory] = useState([]); 
  const [displayStock, setDisplayStock] = useState([]); 
  const [selectedStockItem, setSelectedStockItem] = useState(null); 
  const [revenue, setRevenue] = useState(0);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  const location = useLocation();

  const [expenseForm, setExpenseForm] = useState({ category: 'Groceries', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
  const [stockForm, setStockForm] = useState({ item_name: '', quantity: '', unit: 'kg' });

  useEffect(() => {
    fetchData();
  }, [viewMode, activeTab]);

  const fetchData = async () => {
    // 1. Fetch Revenue
    const { data: revData } = await supabase.from('orders').select('total_price').eq('status', 'completed');
    setRevenue(revData?.reduce((acc, curr) => acc + (curr.total_price || 0), 0) || 0);

    // 2. Fetch Expenses
    const { data: expData } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    setExpenses(expData || []);

    // 3. Fetch Stock and Fix Duplicate Boxes
    const { data: sData } = await supabase.from('stock_records').select('*').order('created_at', { ascending: false });
    setStockHistory(sData || []);
    
    // GROUPING LOGIC: This ensures names like "Rice" only show once
    const groupedStock = Object.values((sData || []).reduce((acc, item) => {
        const nameKey = item.item_name.trim().toLowerCase();
        // Only keep the first (most recent) entry found for this name
        if (!acc[nameKey]) {
            acc[nameKey] = item;
        }
        return acc;
    }, {}));

    setDisplayStock(groupedStock);
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const netIncome = revenue - totalExpenses;
  const maxVal = Math.max(revenue, totalExpenses, netIncome, 1); 

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('expenses').insert([{ ...expenseForm, amount: parseFloat(expenseForm.amount) }]);
    if (!error) { setIsExpenseModalOpen(false); fetchData(); }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('stock_records').insert([{ ...stockForm, quantity: parseFloat(stockForm.quantity) }]);
    if (!error) { setIsStockModalOpen(false); fetchData(); }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden relative">
      {/* SIDEBAR */}
      <aside className="w-60 border-r border-gray-900 flex flex-col p-6 bg-[#0a0a0a] flex-shrink-0">
        <div className="flex items-center gap-2 mb-10 text-lg font-bold">CosyPOS</div>
        <nav className="flex-1 space-y-1">
          {["Menu", "Orders", "Reservation", "Dashboard", "Accounting"].map((name) => (
            <Link key={name} to={`/${name.toLowerCase()}`} className={`block px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${location.pathname === `/${name.toLowerCase()}` ? "bg-[#1a1a1a] text-white" : "text-gray-500 hover:text-gray-300"}`}>{name}</Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="px-8 py-6 flex justify-between items-center">
          <div className="flex bg-[#121212] border border-gray-800 rounded-xl p-1">
            {["overview", "expenses", "stock"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${activeTab === tab ? "bg-[#1a1a1a] text-white" : "text-gray-600"}`}>{tab}</button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          {activeTab === "overview" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <h1 className="text-3xl font-bold">Financial Health</h1>
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-gray-800">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Revenue</p>
                    <div className="text-3xl font-bold text-emerald-400 font-mono">KSh {revenue.toLocaleString()}</div>
                </div>
                <div className="bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-gray-800">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Expenses</p>
                    <div className="text-3xl font-bold text-red-500 font-mono">KSh {totalExpenses.toLocaleString()}</div>
                </div>
                <div className="bg-emerald-500/5 p-8 rounded-[2.5rem] border border-emerald-500/20">
                    <p className="text-[10px] text-emerald-500 uppercase font-bold mb-2">Net Profit</p>
                    <div className="text-3xl font-bold font-mono text-white">KSh {netIncome.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="bg-[#111] p-12 rounded-[3.5rem] border border-gray-900 h-80 flex items-end justify-around gap-12">
                {[{ label: "Revenue", val: revenue, color: "bg-emerald-400" }, { label: "Expenses", val: totalExpenses, color: "bg-red-500" }, { label: "Profit", val: netIncome, color: "bg-white" }].map(item => (
                  <div key={item.label} className="flex flex-col items-center gap-4 w-full max-w-[140px] h-full justify-end">
                    <div className={`${item.color} w-full rounded-t-2xl transition-all duration-1000 ease-out`} style={{ height: `${(Math.max(item.val, 0) / maxVal) * 100}%` }}></div>
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "stock" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Stock Inventory</h2>
                <button onClick={() => setIsStockModalOpen(true)} className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg">+ Update Stock</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {displayStock.map(item => (
                  <div key={item.id} onClick={() => setSelectedStockItem(item.item_name)} className="bg-[#1a1a1a] p-6 rounded-[2rem] border border-gray-800 cursor-pointer hover:border-emerald-500/50 transition-all group relative">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Latest Record</p>
                        <MdHistory className="text-gray-700 group-hover:text-emerald-400 transition-colors" size={18} />
                    </div>
                    <h3 className="text-lg font-bold mb-1 capitalize">{item.item_name}</h3>
                    <p className="text-3xl font-bold text-emerald-400">{item.quantity} <span className="text-xs text-gray-600 font-bold uppercase">{item.unit}</span></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "expenses" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Expense Log</h2>
                <button onClick={() => setIsExpenseModalOpen(true)} className="bg-white text-black px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest">+ New Expense</button>
              </div>
              <div className="bg-[#1a1a1a] rounded-[2.5rem] border border-gray-800 overflow-hidden shadow-xl">
                <table className="w-full text-left">
                  <thead className="bg-gray-900/50 text-[10px] uppercase text-gray-500 font-bold tracking-widest">
                    <tr><th className="p-6">Date</th><th className="p-6">Category</th><th className="p-6">Description</th><th className="p-6 text-right">Amount</th></tr>
                  </thead>
                  <tbody className="text-[13px]">
                    {expenses.map(exp => (
                      <tr key={exp.id} className="border-b border-gray-800/30 hover:bg-white/5 transition-all">
                        <td className="p-6 text-gray-500">{exp.date}</td>
                        <td className="p-6"><span className="px-3 py-1 bg-gray-800 rounded-full text-[10px] font-bold">{exp.category}</span></td>
                        <td className="p-6 text-gray-300">{exp.description}</td>
                        <td className="p-6 text-right font-bold text-emerald-400">KSh {exp.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* STOCK HISTORY SIDE PANEL */}
        {selectedStockItem && (
          <div className="absolute inset-y-0 right-0 w-80 bg-[#111] border-l border-gray-800 shadow-2xl z-40 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-8 border-b border-gray-800 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold capitalize">{selectedStockItem}</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Stock History</p>
                </div>
                <button onClick={() => setSelectedStockItem(null)} className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-gray-500 hover:text-white transition-all"><MdClose size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {stockHistory.filter(s => s.item_name.toLowerCase() === selectedStockItem.toLowerCase()).map(log => (
                    <div key={log.id} className="bg-[#1a1a1a] p-5 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all">
                        <p className="text-[10px] text-gray-600 mb-2 font-medium">{new Date(log.created_at).toLocaleString()}</p>
                        <p className="text-xl font-bold text-white">{log.quantity} <span className="text-xs text-gray-500 uppercase">{log.unit}</span></p>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* MODALS */}
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-[#1a1a1a] rounded-[2.5rem] border border-gray-800 p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">Record Expense</h2>
                <button onClick={() => setIsExpenseModalOpen(false)} className="text-gray-500 hover:text-white"><MdClose size={24}/></button>
              </div>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <select className="w-full bg-[#121212] rounded-xl p-4 text-sm outline-none border-none text-white appearance-none" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                  {['Groceries', 'Utilities', 'Salaries', 'Rent', 'Maintenance', 'Marketing'].map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="text" placeholder="Description" className="w-full bg-[#121212] rounded-xl p-4 text-sm outline-none border-none text-white" required onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}/>
                <input type="number" placeholder="Amount (KSh)" className="w-full bg-[#121212] rounded-xl p-4 text-sm outline-none border-none text-white" required onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}/>
                <input type="date" className="w-full bg-[#121212] rounded-xl p-4 text-sm outline-none border-none text-gray-400" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}/>
                <button type="submit" className="w-full bg-white text-black py-4 rounded-2xl font-bold uppercase text-[11px] tracking-[0.2em] mt-4 hover:bg-emerald-400 transition-all">Save Entry</button>
              </form>
            </div>
          </div>
        )}

        {isStockModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-[#1a1a1a] rounded-[2.5rem] border border-gray-800 p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">Stock Intake</h2>
                <button onClick={() => setIsStockModalOpen(false)} className="text-gray-500 hover:text-white"><MdClose size={24}/></button>
              </div>
              <form onSubmit={handleUpdateStock} className="space-y-4">
                <input type="text" placeholder="Item Name (e.g. Rice, Milk)" className="w-full bg-[#121212] rounded-xl p-4 text-sm outline-none text-white" required onChange={e => setStockForm({...stockForm, item_name: e.target.value})}/>
                <div className="flex gap-2">
                  <input type="number" placeholder="Qty" className="flex-1 bg-[#121212] rounded-xl p-4 text-sm outline-none text-white" required onChange={e => setStockForm({...stockForm, quantity: e.target.value})}/>
                  <select className="bg-[#121212] rounded-xl p-4 text-sm outline-none border-none text-white" onChange={e => setStockForm({...stockForm, unit: e.target.value})}>
                    <option>kg</option><option>ltr</option><option>pcs</option><option>box</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold uppercase text-[11px] tracking-[0.2em] mt-4 hover:bg-white hover:text-black transition-all">Record Stock</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Accounting;