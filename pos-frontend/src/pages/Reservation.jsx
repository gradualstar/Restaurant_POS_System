import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { MdSearch, MdCalendarToday, MdCheckCircle, MdCancel, MdPerson, MdTableBar, MdClose, MdArrowForward } from "react-icons/md";

const Reservation = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("upcoming");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();

  // Form State
  const [formData, setFormData] = useState({
    table_number: "01",
    pax_number: "01 persons",
    reservation_date: "",
    reservation_time: "",
    deposit_fee: "0.00",
    status: "upcoming",
    title: "Mr",
    first_name: "",
    last_name: "",
    phone_number: "",
    email_address: ""
  });

  useEffect(() => {
    fetchReservations();
    const subscription = supabase
      .channel('reservations_realtime')
      .on('postgres_changes', { event: '*', table: 'reservations' }, () => fetchReservations())
      .subscribe();
    return () => supabase.removeChannel(subscription);
  }, [viewMode]);

  const fetchReservations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('status', viewMode)
      .order('reservation_date', { ascending: true });
    if (!error) setReservations(data || []);
    setLoading(false);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    const { error } = await supabase
      .from('reservations')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) alert(error.message);
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    const fullName = `${formData.first_name} ${formData.last_name}`;
    
    const { error } = await supabase
      .from('reservations')
      .insert([{
        table_number: formData.table_number,
        pax_number: formData.pax_number,
        reservation_date: formData.reservation_date,
        reservation_time: formData.reservation_time,
        deposit_fee: parseFloat(formData.deposit_fee),
        status: 'upcoming',
        customer_name: fullName,
        phone_number: formData.phone_number,
        email_address: formData.email_address
      }]);

    if (error) alert(error.message);
    else {
      setIsModalOpen(false);
      setFormData({ ...formData, first_name: "", last_name: "", phone_number: "", email_address: "" });
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-widest">Syncing...</div>;

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-60 border-r border-gray-900 flex flex-col p-6 bg-[#0a0a0a] flex-shrink-0">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-5 h-1 flex flex-col gap-1">
            <div className="w-full h-0.5 bg-white"></div>
            <div className="w-full h-0.5 bg-white"></div>
          </div>
          <span className="text-lg font-bold tracking-tight">CosyPOS</span>
        </div>
        <nav className="flex-1 space-y-1">
          {["Menu", "Orders", "Reservation", "Chat", "Dashboard"].map((name) => (
            <Link key={name} to={`/${name.toLowerCase()}`}
              className={`block px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
                location.pathname === `/${name.toLowerCase()}` ? "bg-[#1a1a1a] text-white" : "text-gray-500"
              }`}
            >
              {name}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="px-8 py-6 flex justify-between items-center">
          <div className="relative w-72">
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
            <input type="text" placeholder="Search..." className="w-full bg-[#121212] border-none rounded-xl py-2 pl-11 text-[13px] outline-none" />
          </div>
          <div className="bg-[#121212] border border-gray-800 rounded-xl p-1 flex">
            {["upcoming", "completed", "cancelled"].map((m) => (
              <button key={m} onClick={() => setViewMode(m)} className={`px-6 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${viewMode === m ? "bg-[#1a1a1a] text-white" : "text-gray-500"}`}>{m}</button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1 capitalize">{viewMode} Reservations</h1>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Active guest list</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-black px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg"
            >
              + New Reservation
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {reservations.map((res) => (
              <div key={res.id} className="bg-[#1a1a1a] p-6 rounded-[2.5rem] border border-gray-800/50">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 bg-[#222] rounded-full flex items-center justify-center text-gray-500"><MdPerson size={20}/></div>
                    <div>
                      <h3 className="text-[13px] font-bold">{res.customer_name}</h3>
                      <p className="text-[10px] text-gray-600">{res.phone_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-[11px] font-bold text-emerald-400">Table {res.table_number}</span>
                    <span className="block text-[9px] text-gray-700 font-bold uppercase">{res.pax_number}</span>
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-[10px] text-gray-400"><MdCalendarToday size={14}/> {res.reservation_date} • {res.reservation_time}</div>
                </div>
                <div className="flex gap-2">
                  {viewMode === "upcoming" ? (
                    <>
                      <button onClick={() => handleStatusUpdate(res.id, 'cancelled')} className="flex-1 bg-red-500/10 text-red-500 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Cancel</button>
                      <button onClick={() => handleStatusUpdate(res.id, 'completed')} className="flex-1 bg-white text-black py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all">Check-In</button>
                    </>
                  ) : (
                    <div className="w-full py-3 bg-gray-900/30 text-gray-600 border border-gray-800 rounded-xl text-[9px] font-bold uppercase text-center">{viewMode}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NEW RESERVATION MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative w-full max-w-xl bg-[#1a1a1a] rounded-[2.5rem] border border-gray-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              
              <form onSubmit={handleCreateReservation} className="p-10">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-bold">Add New Reservation</h2>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-500 hover:text-white"><MdClose size={20}/></button>
                </div>

                <div className="space-y-8">
                  {/* Reservation Details */}
                  <section>
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-6">Reservation Details</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-2">Table Number</label>
                        <select value={formData.table_number} onChange={(e) => setFormData({...formData, table_number: e.target.value})} className="w-full bg-[#121212] border-none rounded-xl p-3 text-[13px] outline-none appearance-none">
                          <option>01</option><option>02</option><option>03</option><option>04</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-2">Pax Number</label>
                        <select value={formData.pax_number} onChange={(e) => setFormData({...formData, pax_number: e.target.value})} className="w-full bg-[#121212] border-none rounded-xl p-3 text-[13px] outline-none">
                          <option>01 persons</option><option>02 persons</option><option>05 persons</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-2">Reservation Date</label>
                        <input type="date" required value={formData.reservation_date} onChange={(e) => setFormData({...formData, reservation_date: e.target.value})} className="w-full bg-[#121212] border-none rounded-xl p-3 text-[13px] outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-2">Reservation Time</label>
                        <input type="time" required value={formData.reservation_time} onChange={(e) => setFormData({...formData, reservation_time: e.target.value})} className="w-full bg-[#121212] border-none rounded-xl p-3 text-[13px] outline-none" />
                      </div>
                    </div>
                  </section>

                  {/* Customer Details */}
                  <section>
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-6">Customer Details</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-[10px] text-gray-500 block mb-2">Title</label>
                        <select value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-[#121212] border-none rounded-xl p-3 text-[13px] outline-none">
                          <option>Mr</option><option>Mrs</option><option>Ms</option>
                        </select>
                      </div>
                      <input type="text" placeholder="First Name" required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full bg-[#121212] border-none rounded-xl p-3 text-[13px] outline-none" />
                      <input type="text" placeholder="Last Name" required value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full bg-[#121212] border-none rounded-xl p-3 text-[13px] outline-none" />
                      <input type="tel" placeholder="Phone Number" required value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} className="w-full bg-[#121212] border-none rounded-xl p-3 text-[13px] outline-none" />
                      <input type="email" placeholder="Email Address" required value={formData.email_address} onChange={(e) => setFormData({...formData, email_address: e.target.value})} className="w-full bg-[#121212] border-none rounded-xl p-3 text-[13px] outline-none" />
                    </div>
                  </section>
                </div>

                <button type="submit" className="w-full mt-10 bg-white text-black py-4 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">
                  Confirm Reservation <MdArrowForward size={16}/>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reservation;