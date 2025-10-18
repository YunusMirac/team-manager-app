export class APICommunicator {
  async sendInvite(email: string) {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:3000/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json",  "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        email: email,
      }),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Fehler bei der Einladung");
    }

    return result;
  }

  async validateInvite(email: string, pin: string) {
    const response = await fetch("http://localhost:3000/validate-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        pin: pin,
      }),
    });
   // Versuch das JSON zu parsen; falls nicht parsebar, fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = null;
  try {
    result = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // kein JSON im Body — result bleibt null
  }

  if (!response.ok) {
    const message = (result && (result.message || result.error)) || response.statusText || "Fehler bei der ersten Registrierung";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err: any = new Error(message);
    err.status = response.status;
    err.payload = result;
    throw err;
  }

  return result;
}

  async signup(username: string, password: string, token: string) {
    const response = await fetch("http://localhost:3000/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });
   // Versuch das JSON zu parsen; falls nicht parsebar, fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = null;
  try {
    result = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // kein JSON im Body — result bleibt null
  }

  if (!response.ok) {
    const message =
      (result && (result.message || result.error)) ||
      response.statusText ||
      "Fehler bei der zweiten Registrierung";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err: any = new Error(message);
    err.status = response.status;
    err.payload = result;
    throw err;
  }

  return result;
}

  // services/APICommunicator.ts
async login(usernameOrEmail: string, password: string) {
  const isEmail = usernameOrEmail.includes("@"); // einfache Email-Prüfung
  const body = isEmail
    ? { email: usernameOrEmail, password }
    : { username: usernameOrEmail, password };

  const response = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
   // Versuch das JSON zu parsen; falls nicht parsebar, fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = null;
  try {
    result = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // kein JSON im Body — result bleibt null
  }

  if (!response.ok) {
    const message =
      (result && (result.message || result.error)) ||
      response.statusText ||
      "Fehler bei der zweiten Registrierung";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err: any = new Error(message);
    err.status = response.status;
    err.payload = result;
    throw err;
  }

  return result;
}

  async getAllUsers() {
    const response = await fetch("http://localhost:3000/users", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

  if (!response.ok) {
      throw new Error(result.message || "Fehler beim Laden der Benutzer");
  }

  return result;
}

  async deleteUser(email: string) {
    const response = await fetch(`http://localhost:3000/users-delete?email=${encodeURIComponent(email)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();

  if (!response.ok) {
      throw new Error(result.message || "Fehler beim Löschen");
  }

  return result;
}
  async unassignTasksOfUser(email: string) {

  const response = await fetch("http://localhost:3000/tasks-unassign-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Fehler beim Entkoppeln der Aufgaben");
  return result;
}

  async addTask(title: string, description: string, due_date: string) {
    const token = localStorage.getItem("token"); 
    const response = await fetch("http://localhost:3000/add-tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
       },
      body: JSON.stringify({
        title,
        description,
        due_date,
      }),
    });
    const result = await response.json();

  if (!response.ok) {
      throw new Error(result.message || "Fehler beim erstellen der Aufgabe");
  }

  return result;
}

  async getAllTasks() {
    const response = await fetch("http://localhost:3000/tasks", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();

  if (!response.ok) {
      throw new Error(result.message || "Fehler beim Laden der Tasks");
  }

  return result;
}

 async getMyTasks(email?: string) {
  const token = localStorage.getItem("token"); // oder verwende Cookie-Variante
  const response = await fetch(`http://localhost:3000/tasks-user?email=${encodeURIComponent(email ?? "")}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Fehler beim Laden der Tasks");
  return result;
}

  async deleteTask(id: string) {
    const token = localStorage.getItem("token"); 
    const response = await fetch("http://localhost:3000/tasks-delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
       },
      body: JSON.stringify({
        id
      }),
    });
    const result = await response.json();

  if (!response.ok) {
      throw new Error(result.message || "Fehler beim Löschen");
  }

  return result;
}

  async openTasks(){
    const response = await fetch("http://localhost:3000/tasks-open", {
      method: "GET",
      headers: {"Content-Type" : "application/json" }
    });
    const result = await response.json();

  if (!response.ok) {
      throw new Error(result.message || "Fehler beim Laden der offenen Aufgaben");
  }

  return result;
}

  async taskAssignTo(taskId: string, userEmail: string) {
  const token = localStorage.getItem("token");
  const response = await fetch("http://localhost:3000/tasks-assigneto", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      taskId,
      userEmail
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Fehler beim Zuweisen der Aufgabe");
  }

  return result;
}

async getUnassignedTasks() {
  const response = await fetch("http://localhost:3000/tasks-unassigned", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Fehler beim Laden der offenen Aufgaben");
  }

  return result.tasks;
}

async getUnassignedTasksNewest() {
  const response = await fetch("http://localhost:3000/tasks-unassigned-newest", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Fehler beim Laden der offenen Aufgaben");
  }

  return result.tasks;
}

async updateTaskStatus(taskId: string, status: string) {
  const res = await fetch("http://localhost:3000/api/tasks/update-status", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: taskId, status }),
  });

  return await res.json();
}


}
