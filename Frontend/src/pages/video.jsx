import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";

import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import withAuth from "../utils/withAuth";

const SERVER_URL = "http://localhost:5000";

const peerConfigConnections = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

function Video() {
  const navigate = useNavigate();

  // Socket and WebRTC references
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const previewVideoRef = useRef(null);
  const previewStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef({});
  const joiningRef = useRef(false);

  // Lobby and media state
  const [username, setUsername] = useState("");
  const [askForUsername, setAskForUsername] = useState(true);
  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [screen, setScreen] = useState(false);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [joining, setJoining] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [meetingNotice, setMeetingNotice] = useState("");

  // Participants and chat
  const [videos, setVideos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const { url } = useParams();
  let meetingCode = url || "";
  try {
    meetingCode = decodeURIComponent(meetingCode);
  } catch {
    meetingCode = url || "";
  }

  // Detect browser capabilities without opening duplicate camera/microphone streams.
  useEffect(() => {
    setScreenAvailable(Boolean(navigator.mediaDevices?.getDisplayMedia));
    if (!navigator.mediaDevices?.getUserMedia) {
      setVideoAvailable(false);
      setAudioAvailable(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const startPreview = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setVideoAvailable(false);
        setPreviewError("Camera preview is not supported by this browser.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        previewStreamRef.current = stream;
        setVideoAvailable(true);
        setPreviewError("");

        const videoElement = previewVideoRef.current;
        if (videoElement) {
          videoElement.srcObject = stream;
          await videoElement.play().catch((error) => {
            console.warn("Camera preview playback failed:", error);
          });
        }
      } catch (error) {
        console.error("Unable to start camera preview:", error);
        setVideoAvailable(false);
        setPreviewError(
          error?.name === "NotAllowedError"
            ? "Camera access was blocked. Allow camera permission in your browser, then reload this page."
            : error?.name === "NotFoundError"
              ? "No camera was found. You can still join if your microphone is available."
              : "Unable to start the camera preview. Check your camera and browser permissions.",
        );
      }
    };

    if (askForUsername) startPreview();

    return () => {
      cancelled = true;
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((track) => track.stop());
        previewStreamRef.current = null;
      }
      if (previewVideoRef.current) previewVideoRef.current.srcObject = null;
    };
  }, [askForUsername]);

  useEffect(() => {
    if (askForUsername || !localVideoRef.current || !localStream) {
      return;
    }

    const videoElement = localVideoRef.current;
    videoElement.srcObject = localStream;

    videoElement.play().catch((err) => {
      console.warn("Could not play local video:", err);
    });

    return () => {
      // Do not stop the stream here; the meeting owns it.
      videoElement.srcObject = null;
    };
  }, [askForUsername, localStream]);

  // Remove a participant and close their peer connection.
  const removePeer = useCallback((peerId) => {
    const peer = peerConnectionsRef.current[peerId];

    if (peer) {
      peer.ontrack = null;
      peer.onicecandidate = null;
      peer.close();

      delete peerConnectionsRef.current[peerId];
    }

    delete pendingIceCandidatesRef.current[peerId];

    setVideos((current) =>
      current.filter((participant) => participant.socketId !== peerId),
    );
  }, []);

  // Apply queued ICE candidates after a remote description is available.
  const flushPendingCandidates = async (peerId, peer) => {
    const candidates = pendingIceCandidatesRef.current[peerId] || [];

    delete pendingIceCandidatesRef.current[peerId];

    for (const candidate of candidates) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Unable to add queued ICE candidate:", error);
      }
    }
  };

  // Create one peer connection per remote participant.
  const createPeerConnection = (peerId) => {
    if (peerId === socketIdRef.current) return null;

    const existingPeer = peerConnectionsRef.current[peerId];

    if (existingPeer) return existingPeer;

    const peer = new RTCPeerConnection(peerConfigConnections);

    peerConnectionsRef.current[peerId] = peer;
    pendingIceCandidatesRef.current[peerId] = [];

    const stream = localStreamRef.current;

    // Add local camera and microphone tracks to the connection.
    if (stream) {
      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });
    }

    peer.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.connected) {
        socketRef.current.emit(
          "signal",
          peerId,
          JSON.stringify({ ice: event.candidate }),
        );
      }
    };

    peer.ontrack = (event) => {
      const remoteStream = event.streams?.[0] || new MediaStream([event.track]);

      setVideos((current) => {
        const existing = current.find(
          (participant) => participant.socketId === peerId,
        );

        if (existing) {
          return current.map((participant) =>
            participant.socketId === peerId
              ? { ...participant, stream: remoteStream }
              : participant,
          );
        }

        return [
          ...current,
          {
            socketId: peerId,
            stream: remoteStream,
          },
        ];
      });
    };

    peer.onconnectionstatechange = () => {
      if (
        peer.connectionState === "failed" ||
        peer.connectionState === "closed"
      ) {
        removePeer(peerId);
      }
    };

    return peer;
  };

  // Send a WebRTC offer to a participant.
  const createOffer = async (peerId) => {
    const peer = createPeerConnection(peerId);

    if (!peer || peer.signalingState !== "stable") return;

    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socketRef.current?.emit(
        "signal",
        peerId,
        JSON.stringify({ sdp: peer.localDescription }),
      );
    } catch (error) {
      console.error("Unable to create WebRTC offer:", error);
    }
  };

  // Process offers, answers, and ICE candidates received over Socket.IO.
  const handleSignal = async (fromId, rawMessage) => {
    if (fromId === socketIdRef.current) return;

    try {
      const signal =
        typeof rawMessage === "string" ? JSON.parse(rawMessage) : rawMessage;

      const peer = createPeerConnection(fromId);

      if (!peer) return;

      if (signal.sdp) {
        const description = new RTCSessionDescription(signal.sdp);

        await peer.setRemoteDescription(description);
        await flushPendingCandidates(fromId, peer);

        if (description.type === "offer") {
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          socketRef.current?.emit(
            "signal",
            fromId,
            JSON.stringify({ sdp: peer.localDescription }),
          );
        }
      }

      if (signal.ice) {
        if (peer.remoteDescription) {
          await peer.addIceCandidate(new RTCIceCandidate(signal.ice));
        } else {
          if (!pendingIceCandidatesRef.current[fromId]) {
            pendingIceCandidatesRef.current[fromId] = [];
          }

          pendingIceCandidatesRef.current[fromId].push(signal.ice);
        }
      }
    } catch (error) {
      console.error("Unable to process WebRTC signal:", error);
    }
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((current) => [...current, { sender, data }]);

    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((count) => count + 1);
    }
  };

  // Establish Socket.IO connection and join this meeting room.
  const connectToSocketServer = () => {
    const socket = io(SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    socketRef.current = socket;

    socket.on("signal", handleSignal);

    socket.on("meeting-role", ({ isHost: hostStatus } = {}) => {
      setIsHost(Boolean(hostStatus));
      setMeetingNotice("");
      setAskForUsername(false);
    });

    socket.on("meeting-error", (payload) => {
      const messageText =
        typeof payload === "string" ? payload : payload?.message;
      const errorText = messageText || "Unable to join this meeting.";
      setMeetingNotice(errorText);
      setJoining(false);
      alert(errorText);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      setAskForUsername(true);
    });

    socket.on("meeting-ended", (payload) => {
      const messageText =
        payload?.message || "The host has ended this meeting.";
      setMeetingNotice(messageText);
      alert(messageText);
      navigate("/home");
    });
    socket.on("chat-message", addMessage);

    socket.on("user-left", (peerId) => {
      removePeer(peerId);
    });

    socket.on("user-joined", (joiningSocketId, clients) => {
      if (!socketIdRef.current) return;

      const otherClients = clients.filter(
        (peerId) => peerId !== socketIdRef.current,
      );

      otherClients.forEach((peerId) => {
        createPeerConnection(peerId);
      });

      // The new participant initiates offers to existing participants.
      if (joiningSocketId === socketIdRef.current) {
        otherClients.forEach((peerId) => {
          createOffer(peerId);
        });
      }
    });

    socket.on("connect", () => {
      socketIdRef.current = socket.id;
      socket.emit("join-call", meetingCode);
      setJoining(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setJoining(false);

      if (
        error.message === "Authentication required" ||
        error.message === "Invalid authentication token" ||
        error.message === "Authentication failed"
      ) {
        localStorage.removeItem("token");
        navigate("/auth");
      }
    });

    socket.connect();
  };

  // Join only after a display name has been entered.
  const connect = async () => {
    if (!username.trim() || joiningRef.current) return;

    if (!meetingCode.trim()) {
      alert("Meeting code is missing. Please open a valid meeting link.");
      return;
    }

    joiningRef.current = true;
    setJoining(true);

    try {
      let stream = null;
      const previewStream = previewStreamRef.current;
      const hasPreviewVideo = Boolean(previewStream?.getVideoTracks().length);

      if (videoAvailable || audioAvailable) {
        // Reuse the preview camera track so the user does not have to reopen it.
        if (hasPreviewVideo) {
          let audioStream = null;
          if (audioAvailable) {
            try {
              audioStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false,
              });
            } catch (error) {
              console.warn("Microphone unavailable:", error);
              setAudioAvailable(false);
            }
          }
          stream = new MediaStream([
            ...(previewStream?.getVideoTracks() || []),
            ...(audioStream?.getAudioTracks() || []),
          ]);
          // Transfer ownership of the reused camera track to the meeting.
          previewStreamRef.current = null;
          if (previewVideoRef.current) previewVideoRef.current.srcObject = null;
        } else {
          stream = await navigator.mediaDevices.getUserMedia({
            video: videoAvailable,
            audio: audioAvailable,
          });
          if (previewStreamRef.current) {
            previewStreamRef.current
              .getTracks()
              .forEach((track) => track.stop());
            previewStreamRef.current = null;
          }
        }

        stream.getVideoTracks().forEach((track) => {
          track.enabled = video;
        });
        stream.getAudioTracks().forEach((track) => {
          track.enabled = audio;
        });
        localStreamRef.current = stream;
        setLocalStream(stream);
      } else if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((track) => track.stop());
        previewStreamRef.current = null;
      }

      connectToSocketServer();
    } catch (error) {
      console.error("Unable to access camera or microphone:", error);
      setJoining(false);
      alert(
        "Could not access your camera or microphone. Check browser permissions and try again.",
      );
    } finally {
      joiningRef.current = false;
    }
  };

  // Toggle the local camera track without restarting the media stream.
  const handleVideo = () => {
    const nextValue = !video;
    setVideo(nextValue);

    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = nextValue;
    });
  };

  // Toggle the local microphone track.
  const handleAudio = () => {
    const nextValue = !audio;
    setAudio(nextValue);

    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = nextValue;
    });
  };

  // Replace the outgoing camera track with the screen-sharing track.
  const startScreenShare = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia || screen) return;

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      screenStreamRef.current = displayStream;
      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) throw new Error("No screen video track was provided.");

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = displayStream;
        localVideoRef.current.play().catch(() => {});
      }

      for (const [peerId, peer] of Object.entries(peerConnectionsRef.current)) {
        const sender = peer
          .getSenders()
          .find((item) => item.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(screenTrack);
        } else {
          // Adding a new sender requires renegotiation with the remote participant.
          peer.addTrack(screenTrack, displayStream);
          if (peer.signalingState === "stable") {
            try {
              const offer = await peer.createOffer();
              await peer.setLocalDescription(offer);
              socketRef.current?.emit(
                "signal",
                peerId,
                JSON.stringify({ sdp: peer.localDescription }),
              );
            } catch (error) {
              console.error("Unable to renegotiate screen sharing:", error);
            }
          }
        }
      }

      screenTrack.onended = () => {
        stopScreenShare();
      };
      setScreen(true);
    } catch (error) {
      console.error("Screen sharing failed:", error);
      setScreen(false);
    }
  };

  const stopScreenShare = async () => {
    const displayStream = screenStreamRef.current;

    if (displayStream) {
      displayStream.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
    }

    screenStreamRef.current = null;

    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];

    for (const peer of Object.values(peerConnectionsRef.current)) {
      const sender = peer
        .getSenders()
        .find((item) => item.track?.kind === "video");

      if (sender) {
        try {
          await sender.replaceTrack(cameraTrack || null);
        } catch (error) {
          console.error("Unable to restore camera track:", error);
        }
      }
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    setScreen(false);
  };

  const handleScreen = () => {
    if (screen) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  const sendMessage = () => {
    const text = message.trim();

    if (!text || !socketRef.current?.connected) return;

    socketRef.current.emit("chat-message", text, username);
    setMessage("");
  };

  const handleEndCall = () => {
    const socket = socketRef.current;
    if (socket?.connected) {
      if (isHost) {
        socket.emit("end-meeting");
      } else {
        socket.emit("leave-meeting");
      }
    }
    navigate("/home");
  };

  // Clean up media and connections when leaving the meeting.
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      Object.values(peerConnectionsRef.current).forEach((peer) => {
        peer.ontrack = null;
        peer.onicecandidate = null;
        peer.close();
      });

      peerConnectionsRef.current = {};
      pendingIceCandidatesRef.current = {};

      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current?.getTracks().forEach((track) => track.stop());

      screenStreamRef.current = null;
      localStreamRef.current = null;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#111019] text-slate-100">
      {askForUsername ? (
        /* Lobby */
        <div
          className="flex min-h-screen items-center justify-center bg-cover bg-center px-5 py-10"
          style={{ backgroundImage: "url('/background.png')" }}
        >
          <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#171522]/95 shadow-2xl md:grid-cols-2">
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <button
                type="button"
                onClick={() => navigate("/home")}
                className="mb-10 flex w-fit items-center gap-2"
              >
                <img src="/logo.svg" alt="" className="h-9 w-9" />
                <span className="text-xl font-bold">
                  Meet<span className="text-blue-400">ora</span>
                </span>
              </button>

              <p className="text-sm font-medium text-blue-400">
                Before you join
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Enter the lobby
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Choose a name your meeting participants will recognize, then
                connect when you're ready.
              </p>

              <form
                className="mt-7"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (username.trim()) connect();
                }}
              >
                <label
                  htmlFor="meeting-username"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Your name
                </label>

                <input
                  id="meeting-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter your name"
                  autoComplete="name"
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                />

                <button
                  type="submit"
                  disabled={!username.trim() || joining}
                  className="mt-4 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {joining ? "Connecting..." : "Connect to meeting"}
                </button>
              </form>
            </div>

            <div className="flex flex-col justify-center border-t border-white/10 bg-black/20 p-5 sm:p-8 md:border-l md:border-t-0">
              <div className="mb-4">
                <h2 className="font-semibold text-white">Camera preview</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Check your camera before connecting.
                </p>
              </div>

              <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                <video
                  ref={previewVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="aspect-video w-full object-cover"
                />
              </div>
              {previewError && (
                <p
                  role="status"
                  className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200"
                >
                  {previewError}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Meeting room */
        <div className="flex min-h-screen flex-col">
          {/* Meeting header */}
          <header className="flex items-center justify-between border-b border-white/10 bg-[#171522] px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="flex items-center gap-2"
              aria-label="Meetora home"
            >
              <img src="/logo.svg" alt="" className="h-8 w-8" />
              <span className="text-lg font-bold">
                Meet<span className="text-blue-400">ora</span>
              </span>
            </button>

            <span className="text-xl text-slate-400 sm:text-sm">
              {isHost ? "Host meeting" : "Video meeting"}
            </span>
          </header>

          {/* Video area and optional chat */}
          <main className="relative flex flex-1 flex-col overflow-hidden">
            <div
              className={`flex-1 p-3 pb-24 sm:p-5 sm:pb-24 ${
                showModal ? "lg:mr-80" : ""
              }`}
            >
              <div className="mx-auto flex h-full max-w-7xl flex-col gap-4">
                {/* Local participant */}
                <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-white/10 bg-[#201e2c]">
                  <video
                    className="aspect-video max-h-[55vh] w-full object-contain"
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                  />
                  <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-3 py-1 text-sm text-white">
                    You {username ? `(${username})` : ""}
                  </span>
                </div>

                {/* Other participants */}
                {videos.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {videos.map((participant) => (
                      <div
                        key={participant.socketId}
                        className="relative overflow-hidden rounded-xl border border-white/10 bg-[#201e2c]"
                      >
                        <video
                          data-socket={participant.socketId}
                          ref={(element) => {
                            if (element && participant.stream) {
                              if (element.srcObject !== participant.stream) {
                                element.srcObject = participant.stream;
                              }
                            }
                          }}
                          autoPlay
                          playsInline
                          className="aspect-video w-full object-contain"
                        />

                        <span className="absolute bottom-2 left-2 max-w-[85%] truncate rounded-md bg-black/60 px-2 py-1 text-xs text-white">
                          {participant.username || "Participant"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-sm text-slate-500">
                    Waiting for others to join...
                  </div>
                )}
              </div>
            </div>

            {/* Chat panel */}
            {showModal && (
              <aside className="fixed inset-x-0 bottom-20 top-16 z-20 flex flex-col border border-white/10 bg-[#171522] shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-4 sm:top-20 sm:w-80 sm:rounded-xl lg:right-5">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
                  <div>
                    <h2 className="font-semibold text-white">Meeting chat</h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Messages from this meeting
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    aria-label="Close chat"
                    className="rounded-lg px-3 py-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {messages.length > 0 ? (
                    messages.map((item, index) => (
                      <div
                        key={item._id || index}
                        className="rounded-lg bg-white/4 p-3"
                      >
                        <p className="wrap-words text-sm font-semibold text-blue-300">
                          {item.sender}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap wrap-words text-sm leading-6 text-slate-200">
                          {item.data}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-full min-h-32 items-center justify-center text-center text-sm text-slate-500">
                      No messages yet. Start the conversation.
                    </div>
                  )}
                </div>

                <form
                  className="flex gap-2 border-t border-white/10 p-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (message.trim()) sendMessage();
                  }}
                >
                  <input
                    type="text"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Write a message..."
                    aria-label="Chat message"
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
                  />

                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </aside>
            )}
          </main>

          {/* Call controls */}
          <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#171522]/95 px-3 py-3 backdrop-blur sm:px-5">
            <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={handleAudio}
                aria-label={audio ? "Mute microphone" : "Unmute microphone"}
                title={audio ? "Mute microphone" : "Unmute microphone"}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition sm:h-14 sm:w-14 ${
                  audio
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                }`}
              >
                {audio ? <MicIcon /> : <MicOffIcon />}
              </button>

              <button
                type="button"
                onClick={handleVideo}
                aria-label={video ? "Turn camera off" : "Turn camera on"}
                title={video ? "Turn camera off" : "Turn camera on"}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition sm:h-14 sm:w-14 ${
                  video
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                }`}
              >
                {video ? <VideocamIcon /> : <VideocamOffIcon />}
              </button>

              {screenAvailable && (
                <button
                  type="button"
                  onClick={handleScreen}
                  aria-label={screen ? "Stop screen sharing" : "Share screen"}
                  title={screen ? "Stop screen sharing" : "Share screen"}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition sm:h-14 sm:w-14 ${
                    screen
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowModal((current) => !current);
                  setNewMessages(0);
                }}
                aria-label="Toggle meeting chat"
                title="Chat"
                className={`relative flex h-12 w-12 items-center justify-center rounded-full transition sm:h-14 sm:w-14 ${
                  showModal
                    ? "bg-blue-600 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <ChatIcon />
                {newMessages > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                    {newMessages > 99 ? "99+" : newMessages}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleEndCall}
                aria-label={
                  isHost ? "End meeting for everyone" : "Leave meeting"
                }
                title={isHost ? "End meeting for everyone" : "Leave meeting"}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700 sm:h-14 sm:w-14"
              >
                <CallEndIcon />
              </button>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}

export default withAuth(Video);
