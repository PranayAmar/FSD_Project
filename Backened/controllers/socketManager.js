import { Server } from "socket.io";
import User from "../models/userModel.js";

// In-memory state for a single Node server instance.
const connections = new Map(); // meetingCode -> Set of active socket IDs
const messages = new Map(); // meetingCode -> chat history
const timeOnLine = new Map(); // socket ID -> join timestamp
const socketMeeting = new Map(); // socket ID -> meetingCode
const meetingHosts = new Map(); // meetingCode -> authenticated user ID
const endedMeetings = new Set(); // Ended codes cannot be reused

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authenticate each Socket.IO connection.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const user = await User.findOne({ token });

      if (!user) {
        return next(new Error("Invalid authentication token"));
      }

      socket.user = {
        id: user._id.toString(),
        username: user.username,
      };

      return next();
    } catch (error) {
      console.error("Socket authentication error:", error.message);
      return next(new Error("Authentication failed"));
    }
  });

  // Remove one participant without ending the meeting.
  const leaveMeeting = (socket) => {
    const meetingCode = socketMeeting.get(socket.id);

    if (!meetingCode) return;

    const participants = connections.get(meetingCode);

    if (participants) {
      participants.delete(socket.id);

      // Notify the remaining participants to close this peer connection.
      for (const participantId of participants) {
        io.to(participantId).emit("user-left", socket.id);
      }
    }

    socketMeeting.delete(socket.id);
    timeOnLine.delete(socket.id);
    socket.leave(meetingCode);

    // Keep the meeting, host identity, and chat history even when everyone
    // leaves. Participants can rejoin until the host explicitly ends it.
  };

  // End the meeting for everyone. Only the authenticated host can do this.
  const endMeeting = (meetingCode, hostUserId) => {
    if (
      !meetingHosts.has(meetingCode) ||
      meetingHosts.get(meetingCode) !== hostUserId
    ) {
      return false;
    }

    // Permanently prevent this meeting code from being reused.
    endedMeetings.add(meetingCode);

    // Notify everyone before clearing their meeting state.
    io.to(meetingCode).emit("meeting-ended", {
      message: "The host has ended this meeting.",
    });

    const participants = connections.get(meetingCode) ?? new Set();

    for (const participantId of participants) {
      const participantSocket = io.sockets.sockets.get(participantId);

      socketMeeting.delete(participantId);
      timeOnLine.delete(participantId);

      if (participantSocket) {
        participantSocket.leave(meetingCode);
      }
    }

    connections.delete(meetingCode);
    messages.delete(meetingCode);
    meetingHosts.delete(meetingCode);

    console.log(`Meeting ended by host: ${meetingCode}`);

    return true;
  };

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Create a meeting and register its creator as the host.
    // The client should emit "create-meeting" before sharing the link.
    socket.on("create-meeting", (rawCode) => {
      const meetingCode = String(rawCode ?? "").trim();

      if (!meetingCode) {
        socket.emit("meeting-error", {
          message: "Meeting code is required.",
        });
        return;
      }

      if (endedMeetings.has(meetingCode) || meetingHosts.has(meetingCode)) {
        socket.emit("meeting-error", {
          message:
            "That meeting code already exists. Please create another meeting.",
        });
        return;
      }

      meetingHosts.set(meetingCode, socket.user.id);
      connections.set(meetingCode, new Set());
      messages.set(meetingCode, []);

      socket.emit("meeting-created", {
        meetingCode,
      });

      console.log(
        `Meeting created: ${meetingCode}, host user: ${socket.user.id}`,
      );
    });

    // Join an existing meeting.
    socket.on("join-call", (rawMeetingCode) => {
      const meetingCode = String(rawMeetingCode ?? "").trim();

      if (!meetingCode) {
        socket.emit("meeting-error", {
          message: "Meeting code is required.",
        });
        return;
      }

      if (endedMeetings.has(meetingCode)) {
        socket.emit("meeting-error", {
          message:
            "This meeting has ended. Please ask the host for a new meeting link.",
        });
        return;
      }

      // Joining must never silently create a new meeting.
      if (!meetingHosts.has(meetingCode)) {
        socket.emit("meeting-error", {
          message:
            "This meeting does not exist. Ask the host to create a new meeting.",
        });
        return;
      }

      const existingMeeting = socketMeeting.get(socket.id);

      // Ignore duplicate join requests for the same socket.
      if (existingMeeting === meetingCode) return;

      // Leave the previous meeting if this socket switches rooms.
      if (existingMeeting) {
        leaveMeeting(socket);
      }

      const participants = connections.get(meetingCode);

      if (!participants) {
        socket.emit("meeting-error", {
          message: "This meeting is no longer available.",
        });
        return;
      }

      participants.add(socket.id);
      socketMeeting.set(socket.id, meetingCode);
      timeOnLine.set(socket.id, Date.now());
      socket.join(meetingCode);

      // Identify whether this authenticated user is the meeting host.
      socket.emit("meeting-role", {
        isHost: meetingHosts.get(meetingCode) === socket.user.id,
      });

      // Preserve the existing frontend's WebRTC event contract.
      const participantIds = [...participants];

      for (const participantId of participantIds) {
        io.to(participantId).emit("user-joined", socket.id, participantIds);
      }

      // Restore chat history for a returning participant.
      const history = messages.get(meetingCode) ?? [];

      for (const item of history) {
        socket.emit(
          "chat-message",
          item.data,
          item.sender,
          item.socketIdSender,
        );
      }
    });

    // Only the host can end the meeting for everyone.
    socket.on("end-meeting", () => {
      const meetingCode = socketMeeting.get(socket.id);

      if (!meetingCode) {
        socket.emit("meeting-error", {
          message: "You are not currently in a meeting.",
        });
        return;
      }

      if (meetingHosts.get(meetingCode) !== socket.user.id) {
        socket.emit("meeting-error", {
          message: "Only the host can end this meeting.",
        });
        return;
      }

      endMeeting(meetingCode, socket.user.id);
    });

    // A participant can leave without ending the meeting.
    socket.on("leave-meeting", () => {
      leaveMeeting(socket);
    });

    // Relay WebRTC offers, answers, and ICE candidates.
    socket.on("signal", (toId, message) => {
      if (typeof toId !== "string" || !toId) return;

      const senderMeeting = socketMeeting.get(socket.id);
      const targetMeeting = socketMeeting.get(toId);

      // Allow signaling only between participants in the same active meeting.
      if (
        !senderMeeting ||
        senderMeeting !== targetMeeting ||
        endedMeetings.has(senderMeeting)
      ) {
        return;
      }

      io.to(toId).emit("signal", socket.id, message);
    });

    // Broadcast and store chat messages.
    socket.on("chat-message", (rawData, rawSender) => {
      const meetingCode = socketMeeting.get(socket.id);

      if (!meetingCode || endedMeetings.has(meetingCode)) return;

      const data = String(rawData ?? "").trim();

      if (!data) return;

      const sender =
        String(rawSender ?? "").trim() ||
        socket.user?.username ||
        "Participant";

      const history = messages.get(meetingCode) ?? [];

      const item = {
        data,
        sender,
        socketIdSender: socket.id,
      };

      history.push(item);

      // Keep chat history bounded.
      const MAX_MESSAGES_PER_MEETING = 200;

      if (history.length > MAX_MESSAGES_PER_MEETING) {
        history.splice(0, history.length - MAX_MESSAGES_PER_MEETING);
      }

      messages.set(meetingCode, history);

      const participants = connections.get(meetingCode) ?? new Set();

      for (const participantId of participants) {
        io.to(participantId).emit(
          "chat-message",
          item.data,
          item.sender,
          item.socketIdSender,
        );
      }
    });

    // Disconnecting means leaving, not ending the meeting.
    // Host identity is tied to the authenticated user ID, so the host
    // can reconnect using the same account and retain host privileges.
    socket.on("disconnect", () => {
      const startedAt = timeOnLine.get(socket.id);

      if (startedAt) {
        const durationSeconds = Math.max(
          0,
          Math.floor((Date.now() - startedAt) / 1000),
        );

        console.log(
          `Socket disconnected: ${socket.id} (online ${durationSeconds}s)`,
        );
      } else {
        console.log(`Socket disconnected: ${socket.id}`);
      }

      leaveMeeting(socket);
    });
  });

  return io;
};
