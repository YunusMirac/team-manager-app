import React from "react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APICommunicator } from "../services/APICommunicator";
import Toast from "../toast/Toast";
import "../styles/FirstSignupPage.css"


export default function FirstSignupPage(){
    const [email, setEmail] = useState("");
    const [pin, setPin] = useState("");
     const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null); // <-- neu
     const navigate = useNavigate();
  const api = new APICommunicator();

  const handleFirstSignup = async (e: React.FormEvent) => {
  e.preventDefault();
try{
    const correct = await api.validateInvite(email, pin);
    const token = correct.token;
    localStorage.setItem("token", token);
    setToast({ message: correct.message || "Invite gültig", type: "success" });
  setTimeout(() => navigate("/signup-step2"), 400);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch(error: any){
        console.log("Validate Invite Error:", error);
        const msg = error?.message || error?.payload?.message || "Validierung fehlgeschlagen!";
        setToast({ message: msg, type: "error" });
      }
  };

  return(
    <>
     {/* Toast wird nur angezeigt, wenn State gesetzt ist */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
    <h1 className="logo">Yunus GmbH</h1>
    <div className="signup-container">
    <h1 className="signup-title">Signup</h1>
  <form className="signup-form" onSubmit={handleFirstSignup}>
        <label htmlFor="signup-email" className="signup-label">E-Mail:</label>
        <input  id="signup-email" className="signup-input" type="email" name="email" placeholder="E-Mail-Adresse eingeben" value={email} onChange={e => setEmail(e.target.value)} required />
        <label htmlFor="signup-pin" className="signup-label">Pin:</label>
        <input id="signup-pin" className="signup-input" type="text" name="pin" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="6-stelliger PIN" value={pin} onChange={e => setPin(e.target.value)} required />
        <br/> 
        <button className="signup-button" type="submit">Weiter</button>
        <p className="signup-login-text">Have an account? <Link className="signup-login-link" to="/login">Login</Link></p>
    </form>
    </div>
    </>
    );
}
