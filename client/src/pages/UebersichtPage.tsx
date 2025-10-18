import { useEffect, useState } from "react";
import { APICommunicator } from "../services/APICommunicator";
import { io } from "socket.io-client";
import "../styles/UebersichtPage.css";

const socket = io("http://localhost:3000");

type Task = {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: string;
  created_at: string;
  email: string;
};

function UebersichtPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const api = new APICommunicator();
  const email = localStorage.getItem("email") as string; // oder verwende Cookie-Variante

  useEffect(() => {
    // oder verwende Cookie-Variante
    api
      .getMyTasks(email)
      .then((data) => {
        setTasks(data);
        setInProgress(data.filter((t: { status: string; }) => t.status === "in bearbeitung"));
        setDone(data.filter((t: { status: string; }) => t.status === "fertig"));
      })
      .catch((err) => console.error("Fehler beim Laden der Aufgaben:", err));

  socket.on("taskUpdated", (updatedTask: Task) => {
    setTasks(prev =>
      prev.map(t => t.id === updatedTask.id ? updatedTask : t)
    );
  });

  return () => {
    socket.off("taskUpdated");
  };
  }, []);

  function formatDate(iso?: string | null) {
    if (!iso) return "-";
    const date = new Date(iso);
    return date.toLocaleString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
  const [inProgress, setInProgress] = useState<Task[]>([]);
  const [done, setDone] = useState<Task[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  function handleDragStart(task: Task) {
    setDraggedTask(task);
  }
  // Drag erlauben (sonst kann man nix droppen)
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  
  // Drop auf eine Spalte
  async function handleDrop(target: "inProgress" | "done") {
    if (!draggedTask) return;

    const taskId = draggedTask.id;
    const newStatus = target === "inProgress" ? "in bearbeitung" : "fertig";
     try {
      await api.updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Task-Status:", error);
    }

    // Entfernen aus alter Liste
    setInProgress((prev) => prev.filter((t) => t.id !== taskId));
    setDone((prev) => prev.filter((t) => t.id !== taskId));

    // Hinzufügen in neue Liste
    if (target === "inProgress") {
      setInProgress((prev) => [...prev, draggedTask!]);
    } else {
      setDone((prev) => [...prev, draggedTask!]);
    }

    setDraggedTask(null);
  }

  return (
    <div className="uebersicht-container">
      <h2 className="logo">Meine Aufgaben</h2>
      {tasks.length === 0 ? (
        <p className="uebersicht-empty">Keine Aufgaben gefunden.</p>
      ) : (
        <div className="uebersicht-board">
          <div
            className="uebersicht-column"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop("inProgress")}
          >
            <h2 className="uebersicht-column-title">In Bearbeitung</h2>
            <div className="uebersicht-task-list">
              {inProgress.map((task) => (
                <div
                  className="uebersicht-task"
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                >
                  <div className="uebersicht-task-title">{task.title}</div>
                  <div className="uebersicht-task-description">{task.description}</div>
                  <div className="uebersicht-task-date">Fälligkeitsdatum: {formatDate(task.due_date)}</div>
                </div>
              ))}
            </div>
          </div>
          <div
            className="uebersicht-column"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop("done")}
          >
            <h2 className="uebersicht-column-title">Erledigt</h2>
            <div className="uebersicht-task-list">
              {done.map((task) => (
                <div
                  className="uebersicht-task"
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                >
                  <div className="uebersicht-task-title">{task.title}</div>
                  <div className="uebersicht-task-description">{task.description}</div>
                  <div className="uebersicht-task-date">Fälligkeitsdatum: {formatDate(task.due_date)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UebersichtPage;
