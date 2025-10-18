import { useEffect, useState } from "react";
import { APICommunicator } from "../services/APICommunicator";
import { io } from "socket.io-client";
import "../styles/StartPage.css"

type Task = {
  id:string,
  title: string;
  description: string;
  due_date: string;
  created_at: string;
};
function StartPage(){
  const api = new APICommunicator();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewestFilter, setIsNewestFilter] = useState(false);

  const socket = io("http://localhost:3000");

  useEffect(() => {
 loadTasks();

  // Listener für neue Tasks
  socket.on("taskAdded", (newTask: Task) => {
    // Task dem aktuellen State hinzufügen
    setTasks(prev => [...prev, { ...newTask, id: newTask.id.toString() }]);
  });

  socket.on("taskDeleted", (id: number) => {
    setTasks(prev => prev.filter(task => task.id !== id.toString()));
  });

  // Optional: Aufräumen beim Verlassen der Seite
  return () => {
    socket.off("taskAdded");
    socket.off("taskDeleted");
  };
}, []);

  async function loadTasks() {
  try {
      const data = await api.getUnassignedTasks();
      const normalized = data.map((t: Task) => ({ ...t, id: t.id?.toString?.() ?? String(t.id) }));
      setTasks(normalized);
      setIsNewestFilter(false);
    } catch (error) {
      console.error(error);
    }
  }

    async function loadNewestTasks() {
    try {
      const data = await api.getUnassignedTasksNewest();
      const normalized = data.map((t: Task) => ({ ...t, id: t.id?.toString?.() ?? String(t.id) }));
      setTasks(normalized);
      setIsNewestFilter(true);
    } catch (error) {
      console.error(error);
    }
  }

 function auswaehlen(task: Task) {
    setSelectedTask(task);
  }
async function yes() {
  if (!selectedTask) return;
      const email = localStorage.getItem("email");
      if (!email) {
        throw new Error("Email not found in localStorage.");
      }
      await api.taskAssignTo(selectedTask.id, email);
      setSelectedTask(null);
      await loadTasks();
  }

      function no() {
      setSelectedTask(null);
    }


      function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const date = new Date(iso);
  return date.toLocaleString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}
  return (
         <div className="startpage-container">
    <h1 className="page-title">Alle Aufgaben</h1>
    {isNewestFilter && <button onClick={loadTasks}>Nach Priorität sortieren</button>}
    {!isNewestFilter && <button onClick={loadNewestTasks}>Nach Erstellungsdatum sortieren</button>}
    {tasks.length === 0 && (<p>Keine Aufgaben gefunden.</p>)}
    {tasks.length > 0 && (
      <div className="tasks-list">
        {tasks.map(task => (
          <div className="task-item" key={task.id}>
            <div className="task-title">{task.title}</div>
            <div className="task-description">{task.description}</div>
            <div className="task-meta">
            <div className="task-due-date">Fällig bis: {formatDate(task.due_date)}</div>
            <div className="task-created-at">Erstellt am: {formatDate(task.created_at)}</div>
              </div>
            <button className="task-select-button" onClick={() => auswaehlen(task)}>auswählen</button>
          </div>
        ))}
        {selectedTask && (
          <div className="task-modal">
            <h2>Auftrag annehmen?</h2>
            <p><strong>Titel:</strong> {selectedTask.title}</p>
            <p><strong>Beschreibung:</strong> {selectedTask.description}</p>
            <p><strong>Fällig am:</strong> {formatDate(selectedTask.due_date)}</p>
            <div className="task-meta">
            <button className="task-modal-button-no" type="button" onClick={() => no()}>Abbrechen</button>
            <button className="task-modal-button-yes" type="button" onClick={() => yes()}>Auftrag annehmen</button>
         </div>
          </div>
        )}
      </div>
    )}
  </div>
      );
    }
  
 
export default StartPage;
