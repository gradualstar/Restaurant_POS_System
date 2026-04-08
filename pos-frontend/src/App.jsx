import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
// Added Accounting and Reservation to the imports from the pages folder
import { Home, Auth, Orders, Tables, Menu, Dashboard, Reservation, Accounting } from "./pages";
import Header from "./components/shared/Header";
import { useSelector } from "react-redux";
import useLoadData from "./hooks/useLoadData";
import FullScreenLoader from "./components/shared/FullScreenLoader";

function Layout() {
 const isLoading = useLoadData();
 const location = useLocation();
 const { isAuth } = useSelector(state => state.user);

 // Added "/reservation" and "/accounting" here so they use their own custom sidebars
 const hideHeaderRoutes = ["/auth", "/dashboard", "/menu", "/reservation", "/accounting"];
 const shouldHideHeader = hideHeaderRoutes.includes(location.pathname);

 if (isLoading) return <FullScreenLoader />;

 return (
   <>
     {/* The global header only shows on routes NOT in the hideHeaderRoutes list */}
     {!shouldHideHeader && <Header />}
    
     <Routes>
       {/* Auth Logic: Protected Routes */}
       <Route path="/" element={isAuth ? <Home /> : <Navigate to="/auth" />} />
      
       {/* Auth Page: Redirects to Dashboard if already logged in */}
       <Route path="/auth" element={isAuth ? <Navigate to="/dashboard" /> : <Auth />} />
      
       {/* POS Pages */}
       <Route path="/orders" element={isAuth ? <Orders /> : <Navigate to="/auth" />} />
       <Route path="/tables" element={isAuth ? <Tables /> : <Navigate to="/auth" />} />
      
       {/* Modern "Cosy" Pages (Database Driven with Custom Sidebars) */}
       <Route path="/menu" element={isAuth ? <Menu /> : <Navigate to="/auth" />} />
       <Route path="/dashboard" element={isAuth ? <Dashboard /> : <Navigate to="/auth" />} />
       <Route path="/reservation" element={isAuth ? <Reservation /> : <Navigate to="/auth" />} />
       <Route path="/accounting" element={isAuth ? <Accounting /> : <Navigate to="/auth" />} />
      
       {/* Fallback */}
       <Route path="*" element={<div className="text-white flex items-center justify-center h-screen">Page Not Found</div>} />
     </Routes>
   </>
 );
}

function App() {
 return (
   <Router>
     <Layout />
   </Router>
 );
}

export default App;