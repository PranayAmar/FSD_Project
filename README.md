# FSD_Project
# Video Conferencing Web Application

A web-based **Video Conferencing Application** that allows users to communicate with each other through real-time video and audio communication. The application is designed to provide a simple and user-friendly platform for conducting online meetings, discussions, and virtual collaboration.

## 📌 Project Overview

The Video Conferencing Web Application is developed as a web-based communication platform using modern web technologies.

The application enables users to:

* Join or create video meetings
* Communicate using real-time video and audio
* Use microphone and camera controls
* Exchange messages through chat
* Share meeting links with other participants
* Participate in meetings through a web browser

For real-time peer-to-peer communication, the project can use **WebRTC (Web Real-Time Communication)**. WebRTC allows browsers to establish direct audio/video communication without requiring a separate video-streaming application.

## ✨ Features

### Core Features

* 🎥 Real-time video conferencing
* 🎙️ Microphone on/off
* 📷 Camera on/off
* 💬 Real-time chat
* 🔗 Meeting room/link generation
* 👥 Multiple participants
* 🖥️ Responsive user interface
* 🚪 Join/leave meeting functionality

### Additional Features

Depending on the implementation, the application may also support:

* Screen sharing
* Participant management
* Meeting history
* User authentication
* Meeting notifications
* Recording
* Speaker/mute indicators

## 🛠️ Technologies Used

### Frontend

* HTML5
* CSS3
* JavaScript
* Bootstrap / Tailwind CSS
* React.js *(if used)*

### Backend

* Node.js
* Express.js

### Real-Time Communication

* **WebRTC** – Real-time audio and video communication
* **WebSocket / Socket.IO** – Signaling and real-time communication between clients

### Database

* MongoDB / MySQL *(depending on implementation)*

### Development Tools

* Visual Studio Code
* Git
* GitHub
* npm

## 🏗️ System Architecture

The application generally follows this architecture:

```text
                ┌──────────────────────┐
                │       User 1         │
                │      Web Browser     │
                └──────────┬───────────┘
                           │
                           │ WebRTC
                           │
                           ▼
                ┌──────────────────────┐
                │   Signaling Server   │
                │ Node.js / Socket.IO  │
                └──────────┬───────────┘
                           │
                           │ WebRTC
                           │
                           ▼
                ┌──────────────────────┐
                │       User 2         │
                │      Web Browser     │
                └──────────────────────┘
```

### How WebRTC Works

WebRTC is responsible for establishing the real-time audio/video connection between participants.

A typical connection process is:

1. User opens the video conferencing website.
2. User creates or joins a meeting room.
3. The browser requests access to the camera and microphone.
4. A signaling mechanism exchanges connection information between users.
5. WebRTC establishes the peer-to-peer connection.
6. Audio and video streams are transmitted between participants.
7. Users can control their camera and microphone during the meeting.

## 🔄 Signaling

WebRTC itself does not define how two users initially find and communicate with each other.

Therefore, a **signaling server** can be used to exchange:

* Session Description Protocol (SDP)
* ICE candidates
* Room information
* Participant information

Socket.IO or WebSocket can be used for this purpose.

```text
User A
  │
  │ Offer
  ▼
Signaling Server
  │
  │ Offer
  ▼
User B

User B
  │
  │ Answer
  ▼
Signaling Server
  │
  │ Answer
  ▼
User A

       ↓

WebRTC Connection Established
```

## 📂 Project Structure

A basic project structure can look like:

```text
video-conferencing/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── styles/
│       └── App.js
│
├── server/
│   ├── server.js
│   ├── routes/
│   └── controllers/
│
├── package.json
├── README.md
└── .gitignore
```

If the project uses only HTML, CSS and JavaScript, the structure can instead be:

```text
video-conferencing/
│
├── index.html
├── meeting.html
├── css/
│   └── style.css
├── js/
│   ├── script.js
│   └── webrtc.js
├── assets/
│   └── images/
│
├── server/
│   └── server.js
│
├── package.json
└── README.md
```

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
```

### 2. Navigate to the Project

```bash
cd video-conferencing
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Server

```bash
npm start
```

or, during development:

```bash
npm run dev
```

### 5. Open the Application

Open the application in a web browser:

```text
http://localhost:3000
```

The exact port may vary depending on the project configuration.

## 🔐 Permissions

The application requires browser permission to access:

* Camera
* Microphone

Users must allow these permissions to participate in a video conference.

## 🌐 Deployment

The application can be deployed using platforms such as:

* Render
* Vercel
* Netlify
* Railway

For production WebRTC applications, HTTPS is generally required because browsers restrict camera and microphone access on insecure origins, with localhost being an important development exception.

## 🚀 Future Enhancements

The following features can be added in future versions:

* User authentication and registration
* Screen sharing
* Meeting recording
* File sharing
* Virtual backgrounds
* Participant list
* Host controls
* Meeting scheduling
* Password-protected meetings
* Database integration
* Push notifications
* Mobile application
* Improved security and encryption
* Scalable media-server infrastructure for larger meetings

## 👨‍💻 Development Team

This project is developed as a collaborative web development project.

### Contributors
Prasanna singh
Pranjal sharma 
Pranay amar

## 📄 License

This project is developed for educational/project purposes.

**Video Conferencing Web Application**
*Real-time communication through the web using modern web technologies.*
