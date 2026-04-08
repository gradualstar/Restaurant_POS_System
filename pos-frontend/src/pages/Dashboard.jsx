import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom"; // Added for navigation
import { supabase } from "../supabaseClient";
import { MdSearch } from "react-icons/md";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({ revenue: 0, paidOrders: 0, tips: 0, dishesSold: 0 });
  const [upsaleData, setUpsaleData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation(); // Hook to track current path

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const { data: orders } = await supabase.from('orders').select('*');
        const { data: dishes } = await supabase.from('dishes').select('*').limit(4);

        if (orders) {
          const rev = orders.reduce((acc, curr) => acc + (curr.total_price || 0), 0);
          setMetrics({
            revenue: rev,
            paidOrders: orders.length,
            tips: rev * 0.1,
            dishesSold: orders.length * 3 
          });

          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          setChartData(days.map(day => ({
            name: day,
            orders: orders.filter(o => days[new Date(o.created_at).getDay()] === day).length
          })));
        }
        if (dishes) setUpsaleData(dishes);
      } catch (err) {
        console.error("Supabase Error:", err);
      }
      setLoading(false);
    };

    fetchAllData();
  }, []);

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white font-bold tracking-widest uppercase">Connecting to Supabase...</div>;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans w-full">
      {/* SIDEBAR - NOW FULLY CLICKABLE */}
      <aside className="w-64 border-r border-gray-900 flex flex-col p-8 bg-[#0a0a0a]">
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
            { name: "Tables", path: "/tables" },
            { name: "Reservation", path: "/reservation" },
            { name: "Chat", path: "/chat" },
            { name: "Dashboard", path: "/dashboard" },
            { name: "Accounting", path: "/accounting" },
            { name: "Settings", path: "/settings" }
          ].map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                location.pathname === item.path 
                  ? "bg-[#252525] text-white" 
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User context footer to match your design */}
        <div className="flex flex-col gap-3 mt-auto pt-6 border-t border-gray-900">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-400 text-black flex items-center justify-center text-[10px] font-bold">LK</div>
                <span className="text-xs text-gray-500">Leslie K.</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-400 text-black flex items-center justify-center text-[10px] font-bold">CW</div>
                <span className="text-xs text-gray-500">Cameron W.</span>
            </div>
        </div>
      </aside>

      {/* CONTENT SECTION */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div className="relative w-80">
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
            <input type="text" placeholder="Search" className="w-full bg-[#151515] border-none rounded-xl py-2.5 pl-12 text-sm text-white outline-none" />
          </div>
          <div className="text-gray-400 text-xs bg-[#151515] px-4 py-2 rounded-lg border border-gray-800">
            {new Date().toDateString()}
          </div>
        </header>

        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-[#b4b4ff] p-6 rounded-[2rem] text-black shadow-lg">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-12 font-bold">$</div>
                <p className="text-sm font-medium opacity-70">Revenue</p>
                <p className="text-3xl font-bold">${metrics.revenue.toFixed(2)}</p>
            </div>
            <div className="bg-[#1a1a1a] p-6 rounded-[2rem] border border-gray-800">
                <div className="w-10 h-10 bg-[#252525] rounded-full flex items-center justify-center mb-12 text-xl">📄</div>
                <p className="text-sm font-medium text-gray-500">Paid orders</p>
                <p className="text-3xl font-bold">{metrics.paidOrders}</p>
            </div>
            <div className="bg-[#1a1a1a] p-6 rounded-[2rem] border border-gray-800">
                <div className="w-10 h-10 bg-[#252525] rounded-full flex items-center justify-center mb-12 text-xl">💰</div>
                <p className="text-sm font-medium text-gray-500">Tip amount</p>
                <p className="text-3xl font-bold">${metrics.tips.toFixed(2)}</p>
            </div>
            <div className="bg-[#1a1a1a] p-6 rounded-[2rem] border border-gray-800">
                <div className="w-10 h-10 bg-[#252525] rounded-full flex items-center justify-center mb-12 text-xl">🍳</div>
                <p className="text-sm font-medium text-gray-500">Dishes sold</p>
                <p className="text-3xl font-bold">{metrics.dishesSold}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-gray-800">
                <h2 className="text-xl font-bold mb-8">Today's upsale</h2>
                <div className="space-y-6">
                    {upsaleData.length > 0 ? upsaleData.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#252525] rounded-2xl flex items-center justify-center text-xl overflow-hidden">
                                {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" alt="" /> : "🍛"}
                            </div>
                            <div>
                                <p className="font-bold text-sm">{item.name}</p>
                                <p className="text-[11px] text-gray-500">Orders: {item.total_orders || 0}</p>
                            </div>
                        </div>
                    )) : <p className="text-gray-600 text-sm italic">No data found in 'dishes' table.</p>}
                </div>
            </div>

            <div className="lg:col-span-3 bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-gray-800 h-[400px]">
                <h2 className="text-xl font-bold mb-8">Accepted orders</h2>
                <ResponsiveContainer width="100%" height="80%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#252525" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#555'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#555'}} />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#1a1a1a', border: 'none'}} />
                        <Bar dataKey="orders" fill="#b4f4e0" radius={[4, 4, 0, 0]} barSize={35} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;