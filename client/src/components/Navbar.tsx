import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (

<>
      {token && (
      <nav>
        
          <Link to="/startpage">Startseite</Link>
          <Link to="/uebersicht">Meine Übersicht</Link>
          {role === "chef" && (
    <>
      <Link to="/mitarbeiter-verwaltung">Mitarbeiter verwalten</Link>
      <Link to="/aufgaben-verwaltung">Aufgaben verwalten</Link>
    </>
  )}
          <button onClick={handleLogout}>Logout</button>
       
         </nav>
      )}
    </>
  );
}

export default Navbar;
