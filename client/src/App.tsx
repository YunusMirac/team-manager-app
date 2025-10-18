import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import FirstSignupPage from "./pages/FirstSignupPage";
import SecondSignupPage from "./pages/SecondSignupPage";
import StartPage from "./pages/StartPage";
import Navbar from "./components/Navbar";
import MitarbeiterPage from "./pages/MitarbeiterPage";
import AufgabenVerwaltungsPage from "./pages/AufgabenVerwaltungsPage";
import UebersichtPage from "./pages/UebersichtPage";


function AppContent() {
  const token = localStorage.getItem("token");
  const location = useLocation();
  const hideNavbarRoutes = ["/login", "/signup-step1", "/signup-step2"];

  return (
    <>
      {!hideNavbarRoutes.includes(location.pathname) && <Navbar />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup-step1" element={<FirstSignupPage />} />
        <Route path="/signup-step2" element={<SecondSignupPage />} />
        <Route path="/startpage" element={<StartPage />} />
         
         {/* Private Routes */}
        {token && (
          <>
            <Route path="/uebersicht" element={<UebersichtPage />} />
            <Route path="/mitarbeiter-verwaltung" element={<MitarbeiterPage />} />
           <Route path="/aufgaben-verwaltung" element={<AufgabenVerwaltungsPage />} /> 
          </>
        )}
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
