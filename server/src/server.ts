import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import pool from "./db.js";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";
import type { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, "../../client/public")));
app.use(cors());
app.use(express.json());

// --- HTTP Server & Socket.io setup ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // in prod: z.B. "http://localhost:5173" oder deine Client-URL
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Client verbunden:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client getrennt:", socket.id);
  });
  });


//users
app.post("/invite", jwtVerify, requireChefRole, async (req, res) => {
  const connection = await pool.connect();
  try {
    const email = req.body.email;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email fehlt" });
    }

    // 6-stellige PIN erzeugen
    function generatePin() {
      return Math.floor(Math.random() * 900000) + 100000;
    }
    const pin = generatePin();

    // Ablaufzeit: jetzt + 15 Minuten
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await connection.query("BEGIN");

    // Upsert in DB
    await connection.query(
      `INSERT INTO users (email, pin, pin_expires, role) 
       VALUES ($1, $2, $3, 'employee')
       ON CONFLICT (email) DO UPDATE 
       SET pin = EXCLUDED.pin, pin_expires = EXCLUDED.pin_expires`,
      [email, pin, expiresAt]
    );

    // E-Mail versenden
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Yunus" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Einladung & PIN",
      text: `Hallo, hier ist deine Einladungspin: ${pin}`,
    });

    await connection.query("COMMIT");

    console.log(`Einladung verschickt an ${email} mit PIN ${pin}`);
    res.json({ success: true, message: "Einladung verschickt" });
  } catch (error) {
    await connection.query("ROLLBACK");
    console.error("Fehler im /invite Handler:", error);
    res.status(500).json({ success: false, message: "Serverfehler" });
  } finally {
    connection.release();
  }
});

app.post("/validate-invite", async (req, res) => {
  const connection = await pool.connect();
  try {
    const email = req.body.email;
    const pin = req.body.pin;
    if (!email || !pin) {
      return res
        .status(400)
        .json({ success: false, message: "email oder pin fehlen" });
    }
    // Prüfen, ob E-Mail schon registriert ist (Passwort gesetzt)
    const exists = (await connection.query(
      "SELECT 1 FROM users WHERE email = $1 AND password IS NOT NULL",
      [email]
    )) as { rowCount: number };

    if (exists.rowCount > 0) {
      return res
        .status(400)
        .json({ success: false, message: "E-Mail bereits registriert" });
    }
    await connection.query("BEGIN");

    const result = await connection.query(
      `SELECT pin_expires FROM users 
       WHERE pin = $1 AND email = $2 AND pin_expires >= NOW()
       FOR UPDATE`,
      [pin, email]
    );
    // Prüfen, ob ein gültiger Datensatz gefunden wurde
    if (result.rows.length === 0) {
      await connection.query("ROLLBACK");
      return res
        .status(400)
        .json({ success: false, message: "PIN ungültig oder abgelaufen" });
    }

    // PIN nach erfolgreicher Prüfung löschen (verbraucht)
    await connection.query(
      "UPDATE users SET pin = NULL, pin_expires = NULL WHERE email = $1",
      [email]
    );

    await connection.query("COMMIT");

    const token = jwt.sign({ email }, process.env.JWT_SECRET || "secret", {
      expiresIn: "2h",
    });

    console.log(`Erfolgreich validiert mit ${email} und PIN ${pin}`);
    return res.json({
      success: true,
      message: "Validierung erfolgreich",
      token,
    });
  } catch (error) {
    await connection.query("ROLLBACK");
    console.error("Fehler im /validate-invite Handler:", error);
    res.status(500).json({ success: false, message: "Serverfehler" });
  } finally {
    connection.release();
  }
});

app.post("/signup", async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    // 2. Token aus dem Authorization-Header holen
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json({ success: false, message: "Kein Token vorhanden" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Token ungültig" });
    }

    const secret = process.env.JWT_SECRET || "secret";
    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Token nicht verifiziert" });
    }
    // 1. Prüfen, ob Benutzername schon existiert
    const usernameCheck = (await pool.query(
      "SELECT 1 FROM users WHERE username = $1",
      [username]
    )) as { rowCount: number };

    if (usernameCheck.rowCount > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Benutzername existiert schon" });
    }
    // 4. Email aus dem Token-Payload holen
    const email = (payload as any).email;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Token enthält keine Email" });
    }
    // 5. Passwort mit bcrypt hashen (verschlüsseln)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 6. Datenbank aktualisieren: username und hashed password für den Nutzer mit der Email speichern
    const updateResult = await pool.query(
      "UPDATE users SET username = $1, password = $2 WHERE email = $3",
      [username, hashedPassword, email]
    );

    if (updateResult.rowCount === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Benutzer nicht gefunden" });
    }

    // 7. Erfolgs-Log und Antwort an den Client
    console.log(
      `User ${email} erfolgreich registriert mit Username ${username}`
    );
    res.json({ success: true, message: "Registrierung erfolgreich" });
  } catch (error) {
    console.error("Fehler im /signup Handler:", error);
    res.status(500).json({ success: false, message: "Serverfehler" });
  }
});

app.post("/login", async (req, res) => {
  try {
    console.log("Login Body:", req.body);
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;

    if (!username && !email) {
      return res
        .status(400)
        .json({ success: false, message: "Benutzername oder email fehlt" });
    }
    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Passwort fehlt" });
    }

    const result = await pool.query(
      "SELECT username, email, password, role FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );
     console.log("DB Result:", result.rows);

    if (result.rowCount === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Benutzer nicht gefunden" });
    }
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Falsches Passwort" });
    }
    const token = jwt.sign(
      {
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!, // Geheimschlüssel, besser aus ENV holen
      { expiresIn: "6h" } // Token läuft nach 6 Stunden ab
    );

    return res.json({
      success: true,
      message: "Login erfolgreich",
      user: {
        token,
        username: user.username,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error("Fehler im /login Handler:", error);
    res.status(500).json({ success: false, message: "Serverfehler" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT email, username, role, created_at FROM users ORDER BY created_at"
    );
    res.json(result.rows);
  } catch (error) {
    console.log("Fehler im /users Handler:", error);
    res.status(500).json({ message: "Fehler beim Abrufen der Nutzer" });
  }
});

app.delete("/users-delete", jwtVerify, requireChefRole, async (req, res) => {
  const email = req.query.email;
  try {
    const result = await pool.query("DELETE FROM users WHERE email = $1", 
      [email]
    );
    return res.json({ success: true });
  } catch (error) {
    console.log("Fehler im /users-delete Handler:", error);
    res.status(500).json({ message: "Fehler beim Löschen von user" });
  }
});
app.post("/tasks-unassign-user", async (req, res) => {
  const email = req.body.email;
  try{
 // 1. Aufgaben "in bearbeitung" → "offen" + assigned_to = NULL
    await pool.query(
      "UPDATE tasks SET status = 'offen', assigned_to = NULL WHERE assigned_to = $1 AND status = 'in bearbeitung'",
      [email]
    );
    // 2. Aufgaben "fertig" → assigned_to = NULL (Status bleibt "fertig")
    await pool.query(
      "UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1 AND status = 'fertig'",
      [email]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Fehler beim Entkoppeln der Aufgaben:", error);
    res.status(500).json({ success: false, message: "Serverfehler beim Entkoppeln der Aufgaben." });
  }
});
//tasks

app.get("/tasks", async (req,res) =>{
try {
  const result = await pool.query(
    "SELECT * FROM tasks ORDER BY due_date"
  );
  res.json(result.rows);
} catch (error) {
  console.log("Fehler im /tasks Handler:", error);
    res.status(500).json({ message: "Fehler beim Abrufen der Aufgaben" });
}
});

function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: "Kein Token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret");
    (req as any).user = payload; // z.B. { id, email, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Ungültiges Token" });
  }
}

app.get("/tasks-user", verifyToken, async (req,res) =>{
  const email = req.query.email;
  try {
  const result = await pool.query(
    "SELECT * FROM tasks WHERE assigned_to = $1 ORDER BY due_date",
    [email]
  );
  res.json(result.rows);
} catch (error) {
  console.log("Fehler im /tasks-user Handler:", error);
    res.status(500).json({ message: "Fehler beim Abrufen der Aufgaben von User" });
}
});

export function jwtVerify(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  console.log("Auth Header:", authHeader);
  if (!authHeader) return res.status(401).json({ message: "Kein Token" });

  const token = authHeader.split(" ")[1];
  console.log("Token extrahiert:", token); // 🔹 Debug

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    console.log("Payload nach verify:", payload); // 🔹 Debug
    req.user = payload; // payload enthält jetzt auch die Rolle
    next();
  } catch (err) {
     console.error("JWT Fehler:", err); // 🔹 Debug
    res.status(401).json({ message: "Ungültiges Token" });
  }
}

function requireChefRole(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user; // falls `req.user` nicht im Typ bekannt ist
  console.log("Role im Token:", user?.role); // zur Kontrolle
  if (user && user.role === "chef") {
    return next();
  }
  return res.status(403).json({ message: "Nur Chefs dürfen das." });
}

app.delete("/tasks-delete", jwtVerify, requireChefRole, async (req,res) =>{
  const id = req.body.id;
  try {
     await pool.query(
      "DELETE FROM tasks WHERE id = $1",
      [id]
    );
     // Socket-Event an alle Clients senden
    io.emit("taskDeleted", id);

    return res.json({ success: true });
  } catch (error) {
     console.log("Fehler im /tasks-delete Handler:", error);
    res.status(500).json({ message: "Fehler beim Löschen von task" });
  }
});

app.post("/add-tasks", jwtVerify, requireChefRole, async (req,res) => {
  try {
    const { title, description, due_date } = req.body;

    if (!title || !description || !due_date) {
      return res
        .status(400)
        .json({ success: false, message: "Bitte alle Pflichtfelder ausfüllen." });
    }

    const result = await pool.query(
      `INSERT INTO tasks (title, description, due_date)
       VALUES ($1, $2, $3) RETURNING *`,
      [title, description, due_date]
    );
    
    const newTask = result.rows[0];

    // Socket-Event an alle Clients senden
    io.emit("taskAdded", newTask);

    res.json({ success: true, task: newTask });
  } catch (error) {
    console.error("Fehler im /add-tasks Handler:", error);
    res.status(500).json({ success: false, message: "Serverfehler beim Erstellen der Aufgabe." });
  }
});

app.post("/tasks-assigneto", jwtVerify, async (req, res) => {
  const { taskId, userEmail } = req.body;

  try {
    // Überprüfen, ob die Aufgabe existiert
    const taskResult = await pool.query("SELECT * FROM tasks WHERE id = $1", [taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Aufgabe nicht gefunden." });
    }

    // Aufgabe dem Benutzer zuweisen
    await pool.query("UPDATE tasks SET assigned_to = $1, status = 'in bearbeitung' WHERE id = $2", [userEmail, taskId]);

    res.json({ success: true, message: "Aufgabe erfolgreich zugewiesen." });
  } catch (error) {
    console.error("Fehler im /tasks-assigneto Handler:", error);
    res.status(500).json({ success: false, message: "Serverfehler beim Zuweisen der Aufgabe." });
  }
});

app.get("/tasks-unassigned", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks WHERE assigned_to IS NULL ORDER BY due_date ASC"
    );
    res.json({ success: true, tasks: result.rows });
  } catch (err) {
    console.error("Fehler beim Laden unzugewiesener Tasks:", err);
    res.status(500).json({ success: false, message: "Serverfehler" });
  }
});

app.get("/tasks-unassigned-newest", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks WHERE assigned_to IS NULL ORDER BY created_at DESC"
    );
    res.json({ success: true, tasks: result.rows });
  } catch (err) {
    console.error("Fehler beim Laden unzugewiesener Tasks (neueste zuerst):", err);
    res.status(500).json({ success: false, message: "Serverfehler" });
  }
});

// Route: alle offenen Tasks abrufen
app.get("/tasks-open", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks WHERE status = $1 ORDER BY due_date ASC",
      ["offen"]
    );
    res.json({ success: true, tasks: result.rows });
  } catch (err) {
    console.error("Fehler beim Laden offener Tasks:", err);
    res.status(500).json({ success: false, message: "Serverfehler" });
  }
});

// PUT /api/tasks/update-status
app.put("/api/tasks/update-status", async (req, res) => {
  const { id, status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ success: false, message: "ID und Status erforderlich" });
  }

  try {
    const result = await pool.query(
      `UPDATE tasks
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Task nicht gefunden" });
    }

    const updatedTask = result.rows[0];
    // Socket.io-Event an alle Clients senden
    io.emit("taskUpdated", updatedTask);
    return res.json(updatedTask); // minimal: gib die aktualisierte Task zurück

  } catch (err) {
    console.error("Fehler beim Status-Update:", err);
    return res.status(500).json({ success: false, message: "Serverfehler beim Update" });
  }
});




app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/public/html/index.html"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
