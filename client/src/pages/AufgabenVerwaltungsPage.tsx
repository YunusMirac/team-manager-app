import { useEffect, useState } from "react";
import { APICommunicator } from "../services/APICommunicator";
import { io } from "socket.io-client";
import "../styles/AufgabenVerwaltungsPage.css";


const socket = io("http://localhost:3000"); // Server-URL

type Task = {
  id:string,
  title: string;
  description: string;
  due_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  assigned_to: string;
};

function AufgabenVerwaltungsPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due_date, setDueDate] = useState("");
  const api = new APICommunicator();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);

useEffect(() => {
    loadTasks();

    // Socket-Listener für neue Tasks
    socket.on("taskAdded", (newTask: Task) => {
      setTasks(prev => [...prev, { ...newTask, id: newTask.id.toString() }]);
    });

    // Socket-Listener für gelöschte Tasks
    socket.on("taskDeleted", (id: number) => {
      const idStr = id.toString();
      setTasks(prev => prev.filter(t => t.id !== idStr));
    });

    // Aufräumen beim Verlassen
    return () => {
      socket.off("taskAdded");
      socket.off("taskDeleted");
    };
  });

  async function loadTasks() {
    try {
       const data = await api.getAllTasks();
      const normalized = data.map((t: Task) => ({ ...t, id: t.id?.toString?.() ?? String(t.id) }));
      setTasks(normalized);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.addTask(title, description, due_date);
    // neue Task kommt über socket event; Formular optional zurücksetzen
      setShowForm(false);
      setTitle("");
      setDescription("");
      setDueDate("");
  };

  const handleDelete = async (idStr: string) => {
  try {
    await api.deleteTask(idStr);  // ruft die REST-Route auf
    // kein Socket-Emit nötig, das kommt vom Server automatisch zurück
  } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <h1 className="logo">Task Management</h1>
      <div className="page-container-tasks">
      <button className="toggle-form-button" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Formular schließen" : "Neue Aufgabe erstellen"}
      </button>

        {tasks.length === 0 && showForm === false && (
        <p>Keine Aufgaben gefunden</p>
      )}
      {tasks.length>0 && showForm === false &&(
        <table className="tasks-table">
       <thead className="tasks-table-head">
                  <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Created at</th>
                      <th>Assigned to</th>
                      <th>Action</th>
                  </tr>
              </thead><tbody>
                      {tasks.map( task => (
                          <tr key={task.id}>
                            <td>{task.id}</td>
                              <td>{task.title}</td>
                              <td>{task.description}</td>
                              <td>{formatDate(task.due_date)}</td>
                              <td>{task.status}</td>
                              <td>{formatDate(task.created_at)}</td>
                              <td>{task.assigned_to}</td>
                              <td><button className="delete-button" onClick={() => handleDelete(task.id)}>Delete</button></td>
                          </tr>
                      ))}
                  </tbody>
                  </table>
      )}
</div>
{showForm && (
  <form className="task-form" onSubmit={handleSubmit}>
    <p className="task-form-label">Titel:</p>
    <input
      className="task-form-input"
      type="text"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      required
    />

    <p className="task-form-label">Beschreibung:</p>
    <textarea
      className="task-form-textarea"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      required
    />

    <p className="task-form-label">Fälligkeitsdatum:</p>
    <input
      className="task-form-input"
      type="date"
      value={due_date}
      onChange={(e) => setDueDate(e.target.value)}
      required
    />

    <br />
    <button className="task-form-submit" type="submit">Aufgabe erstellen</button>
  </form>
)}
</>
);
}

export default AufgabenVerwaltungsPage;
