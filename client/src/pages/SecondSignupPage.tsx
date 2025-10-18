import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APICommunicator } from "../services/APICommunicator";
import Toast from "../toast/Toast";
import "../styles/SecondSignupPage.css"
import "../styles/FirstSignupPage.css"


export default function SecondSignupPage(){
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
     const navigate = useNavigate();
  const api = new APICommunicator();

  const handleSecondSignup = async (e: React.FormEvent) => {
  e.preventDefault();
try{
        const token = localStorage.getItem("token") as string;
        const result = await api.signup(username, password, token);
        setToast({ message: result?.message || "Registrierung erfolgreich!", type: "success" });

      // kurze Verzögerung, damit Toast sichtbar bleibt
      setTimeout(() => navigate("/login"), 600);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.log("Signup Error:", error);
      const msg = error?.message || error?.payload?.message || "Registrierung fehlgeschlagen!";
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
                <form className="signup-form" onSubmit={handleSecondSignup}>
                    <h4 className="signup-instruction-text">choose a username and password</h4>
                    <label htmlFor="username" className="signup-label">Username:</label>
                    <input
                        type="text"
                        name="username"
                        id="username"
                        className="signup-input"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                    />
                    <label htmlFor="password" className="signup-label">Password:</label>
                    <input
                        type="password"
                        name="firstPassword"
                        id="password"
                        className="signup-input"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                    <br/>
                    <button className="signup-button" type="submit">Signup</button>
                </form>
            </div>
        </>
    );
}
