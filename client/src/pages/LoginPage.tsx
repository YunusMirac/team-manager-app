import React from "react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { APICommunicator } from "../services/APICommunicator";
import Toast from "../toast/Toast";
import "../styles/LoginPage.css"; 

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const navigate = useNavigate();
  const api = new APICommunicator();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await api.login(usernameOrEmail, password);
      localStorage.setItem("token", result.user.token);
      localStorage.setItem("role", result.user.role);
      localStorage.setItem("username", result.user.username);
      localStorage.setItem("email", result.user.email);
      setToast({ message: "Login erfolgreich!", type: "success" });

      // Kleine Verzögerung, damit Toast sichtbar bleibt
      setTimeout(() => {
        navigate("/startpage");
      }, 400);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
    console.log("Login Error:", error);
    const msg = error?.message || error?.payload?.message || "Login fehlgeschlagen!";
    setToast({ message: msg, type: "error" });
    }
  };

  return (
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
      <div className="login-container">
        <h2 className="login-title">Login</h2>
        <form className="login-form" onSubmit={handleLogin}>
          <label htmlFor="loginInput" className="login-label">Username or E-Mail:</label>
          <input className="login-input" type="text" id="loginInput" value={usernameOrEmail} onChange={e => setUsernameOrEmail(e.target.value)} required/>
          <label htmlFor="loginPassword" className="login-label">Password:</label>
          <input className="login-input" type="password" id="loginPassword" value={password} onChange={e => setPassword(e.target.value)} required />
          <br/>
          <button type="submit" className="login-button">Submit</button>
          <p className="login-signup-text">Not an account? <Link className="login-signup-link" to="/signup-step1">Signup</Link></p>
        </form>
      </div>
    </>
  );
}
