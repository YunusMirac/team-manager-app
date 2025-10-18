import { APICommunicator } from "../services/APICommunicator";
import { useState, useEffect } from "react";
import "../styles/MitarbeiterPage.css";

type User = {
    email: string,
    username: string,
    role: string,
    created_at: string
}
type Task = {
    id: string,
    title: string,
    description: string,
    due_date: string,
    status: string,
    created_at: string,
    assigned_to: string
}

function MitarbeiterPage() {
    const api = new APICommunicator();
    const [users, setUsers] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Task[] | null>(null);
    const [invitePage, setInvitePage] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);


    useEffect(() => {
    loadUsers();

  }, []);

async function loadUsers() {
    try {
      const data = await api.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  }

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const date = new Date(iso);
  return date.toLocaleString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

  async function handleDelete(email: string) {
    try {
      await api.unassignTasksOfUser(email);
      await api.deleteUser(email); // email wird an die API übergeben
      // Benutzer direkt aus dem State entfernen, UI aktualisiert sich
      setUsers(prev => prev.filter(u => u.email !== email));
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
    }
  }

  async function handleInfo(email: string) {
   try {
      const user = users.find(u => u.email === email) || null;
      setSelectedUser(user);
      const tasks = await api.getMyTasks(email);
      setTasks(tasks ?? []);
  } catch (error) {
      console.error("Fehler beim Laden der Aufgaben:", error);
    }
}

  async function inviteUser(email: string) {
    try {
      await api.sendInvite(email);
      alert("Einladung gesendet!");
      setInvitePage(false);
    } catch (error) {
      console.error("Fehler beim Einladen:", error);
    }
  }

  function invitePageOpen() {
    setInvitePage(true);
  }

return (
  <>
    <h1 className="logo">Mitarbeiter Management</h1>
    {invitePage ? (
      <div className="invite-page">
        <h2 className="invite-page-title">Benutzer einladen</h2>
        <label className="invite-page-label" htmlFor="invite-email">E-Mail:</label>
        <div className="invite-input-row">
          <input className="invite-page-input" type="email" id="invite-email" placeholder="E-Mail eingeben" />
          <button className="invite-page-button" onClick={() => {
            const input = document.getElementById("invite-email") as HTMLInputElement | null;
            if (input) inviteUser(input.value);
          }}>Einladen</button>
        </div>
        <button className="invite-page-button-back" onClick={() => setInvitePage(false)}>Zurück</button>
      </div>
    ) : tasks !== null ? (
      <div className="user-tasks-container">
        <h1 className="user-tasks-title">Aufgaben von {selectedUser?.username ?? "Unbekannt"}</h1>
        {tasks.length === 0 && (<p className="user-tasks-empty">Keine Aufgaben für diesen Benutzer gefunden.</p>)}
        <div className="user-tasks-div">
          <button className="user-tasks-back" onClick={() => setTasks(null)}>zurück</button>
          {tasks.map(task => (
            <li className="user-task-item" key={task.id}>
              <h3 className="user-task-title">{task.title}</h3>
              <p className="user-task-description">Beschreibung: {task.description}</p>
              <p className="user-task-due-date">Fällig am: {formatDate(task.due_date)}</p>
              <p className="user-task-status">Status: {task.status}</p>
            </li>
          ))}
        </div>
      </div>
    ) : (
      <>
        {users.length === 0 && (
          <div className="users-empty-container">
            <button className="users-invite-button" onClick={() => invitePageOpen()}>+ Benutzer einladen</button>
            <p className="users-empty-text">Keine Benutzer gefunden.</p>
          </div>
        )}
        {users.length > 0 && (
          <div className="users-table-container">
            <button className="users-invite-button" onClick={() => invitePageOpen()}>+ Benutzer einladen</button>
            <table className="users-table">
              <thead className="users-table-head">
                <tr>
                  <th className="users-table-header-email">E-Mail</th>
                  <th className="users-table-header-username">Username</th>
                  <th className="users-table-header-role">Role</th>
                  <th className="users-table-header-created">Created at</th>
                  <th className="users-table-header-action">Action</th>
                </tr>
              </thead>
              <tbody className="users-table-body">
                {users.map(user => (
                  <tr className="users-table-row" key={user.email}>
                    <td className="users-table-cell-email">{user.email}</td>
                    <td className="users-table-cell-username">{user.username ?? "—"}</td>
                    <td className="users-table-cell-role">{user.role}</td>
                    <td className="users-table-cell-created">{formatDate(user.created_at)}</td>
                    <td className="users-table-cell-action">
                      <button className="users-info-button" onClick={() => handleInfo(user.email)}>Information</button>
                      <button className="users-delete-button" onClick={() => handleDelete(user.email)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    )}
  </>
);
}


export default MitarbeiterPage;