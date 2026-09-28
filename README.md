OrbitPM 

Project Management Platform

"Manage teams, projects and tasks with real-time collaboration."

> This Project is currently under development.

## Tech Stack

### Frontend 

- React
- Redux Toolkit
- React Router
- Bootstrap
- Axios
- React Beautiful DnD (or dnd-kit)
- Socket.io Client

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- Socket.io
- Redis
- Brivo (Mailing)

### Dev Tools

- ESLint
- Prettier

## Features (Planned)

- User Authentication
- Create & Manage Workspaces
- Boards
- Lists
- Tasks
- Drag & Drop
- Comments
- Due Dates
- Team Collaboration

## Project Structure 

``` 
project/
├── frontend/
└── backend/

```
## Getting Started

### Clone the repository

```bash
git clone <repository-url>
```

### Install dependencies

```bash
cd frontend
npm install

cd ../backend
npm install
```

### Run the project

```bash
# Start backend (Port 1800)
cd backend
npm run dev

# Start frontend (Port 4321)
cd frontend
npm run dev
```

## Implemented Architecture & Features

### Core Hierarchy
```
Organization ➔ Projects ➔ Boards ➔ Lists ➔ Cards ➔ (Checklists, Comments, Attachments, Activity)
```

- **Authentication & Security**: JWT cookie-based session, Redis caching, Helmet headers, CORS credentials, email verification and password reset.
- **Organization & Role Management (Day 8–9)**: Owner, Admin, Editor, Viewer permission matrix, invite teammates via tokenized email links, remove members, leave organization, promote/demote roles, suspend/unsuspend members.
- **Projects & Dashboard (Day 10–11)**: Project model with soft delete and archive, multi-organization switcher, dashboard statistics (organizations, projects, teammates), recent projects grid.
- **Boards & Lists (Day 12–13)**: Multi-board support per project, default Kanban columns (Todo, Doing, Done) seeded on board creation, list reordering via efficient MongoDB `bulkWrite`.
- **Kanban System & Drag-and-Drop (Day 15–16)**: HTML5 drag & drop for tasks across lists with persistent position indexing and optimistic UI updates.
- **Card Details & Collaboration (Day 17–20)**:
  - Custom colored labels and priority levels (Low, Medium, High, Urgent).
  - Due date assignment and member assignment from organization team.
  - Interactive checklists with progress indicator and activity tracking.
  - Card discussion thread with author details and deletion permissions.
  - File attachments supporting PDFs and images via Supabase storage.
- **Activity Log & Audit Trail (Day 21)**: Reusable asynchronous activity tracking for card movements, task creations, comments, and checklist completions with slide-over drawer.
- **Notifications (Day 22)**: In-app notification center with real-time unread badge, dropdown feed, and auto-generated alerts on task assignments and comments.
- **Omni Search & Filtering (Day 23)**: Safe regex-escaped search across projects, tasks, and team members with `Ctrl+K` command palette and column filters.
- **Security & Performance (Day 24–25)**: Strict backend role enforcement, MongoDB compound indexes, request sanitization, and React Query caching.

## License

This project is licensed under the MIT License.