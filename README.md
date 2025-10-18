# TeamManager - A Full-Stack Task Management Application

A robust full-stack web application designed for teams that need an intuitive system to manage tasks and workflows.



## Key Features

This project provides a comprehensive solution for agile team collaboration, with distinct roles for managers and employees.

### Manager Fesatures
- **User Management**: Seamlessly invite new employees to the team and remove users when necessary.
- **Task Management**: Create new tasks with detailesd descriptions and delete them as needed.
- **Status Tracking**: Get a clear overwiew of the project progress by tracking the status and belonging of the tasks(Open, in Progress, Done)

## Employee Features
- **Task Assignment**: Employees can pick and assign available tasks to themselves from an open task pool.
- **Progress Updates**: Mark tasks as completed, providing clear visibility on finished work.
- **Drag and Drop Functionality**: Intuitively move tasks between different status columns from "In Progress" to "Done" using a drag-and-drop interface.



## Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React, TypeScript, CSS |
| Backend |  Node.js, Express (javascript)|
| Real-time | WebSockets |
| Auth | JWT (JSON Web Tokens) |
| Database | PostgreSQL (Docker) |

---

## Screenshots







## Getting Started

To get a local copy up and running, follow these simple steps.

Prerequisites
- Node.js
- Docker

### Installation & Setup

1. Clone the repo

```
git clone https://github.com/YunusMirac/team-manager-app.git
cd team-manager-app
```


2. Setup Backend
```
cd server
npm install
# Create a .env file and add your database credentials and secrets
# (see .env.example for reference)
npm run start
```


3. Setup Frontend (in a new terminal)
```
cd client
npm install
npm run dev
```

## Author
Yunus Mirac Comart
Media Informatics Student - Aspiring Software Developer

GitHub Account: https://github.com/YunusMirac