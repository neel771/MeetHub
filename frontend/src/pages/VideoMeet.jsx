import React from 'react'
import { useRef, useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import { Badge, IconButton } from '@mui/material';
import Button from '@mui/material/Button';
import styles from '../styles/VideoComponent.module.css';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import { getSocketServerURL } from '../utils/apiConfig.js';

// Dynamic server URL - works for localhost AND network deployments
const server_url = getSocketServerURL();

var connections = {}

const peerConfigConnections = {
  "iceServers": [
    { "urls": "stun:stun.l.google.com:19302" }
  ]
}

export default function VideoMeetComponent() {


  var socketRef = useRef();
  let socketIdRef = useRef();

  let localVideoref = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);

  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState([]);

  let [audio, setAudio] = useState();

  let [screen, setScreen] = useState();

  let [showModal, setModal] = useState(true);

  let [screenAvailable, setScreenAvailable] = useState();

  let [messages, setMessages] = useState([])

  let [message, setMessage] = useState("");

  let [newMessages, setNewMessages] = useState(3);

  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");

  const videoRef = useRef([])

  let [videos, setVideos] = useState([])



  const getPermission = async () => {
    // guard for browsers that don't expose mediaDevices (e.g. insecure HTTP or unsupported)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("MediaDevices API not available. Camera/microphone may require HTTPS or a secure context.");
      setVideoAvailable(false);
      setAudioAvailable(false);
      setScreenAvailable(false);
      return;
    }
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });

      if (videoPermission) {
        setVideoAvailable(true);
      } else {
        setVideoAvailable(false);
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (audioPermission) {
        setAudioAvailable(true);
      } else {
        setAudioAvailable(false);
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediastream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });

        if (userMediastream) {
          window.localStream = userMediastream;
          if (localVideoref.current) {//
            localVideoref.current.srcObject = userMediastream;
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    getPermission();
  }, [])


  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach(track => track.stop())
    } catch (e) {
      console.log(e);
    }
    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description)
          .then(() => {
            socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }));
          })
          .catch((e) => { console.log(e) })
      })
    }
    stream.getTracks().forEach(track => track.onended = () => {
      setVideo(false);
      setAudio(false);

      try {
        let tracks = localVideoref.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
      } catch (e) { console.log(e) }

      //TODO BlackSilence
      let blackSilence = (...args) => new MediaStream([black(...args), silence()])
      window.localStream = blackSilence()
      localVideoref.current.srcObject = window.localStream


      for (let id in connections) {
        connections[id].addStream(window.localStream)

        connections[id].createOffer().then((description) => {
          connections[id].setLocalDescription(description)
            .then(() => {
              socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
            })
            .catch(e => console.log(e))
        })
      }
    })
  }
  let silence = () => {
    let ctx = new AudioContext()
    let oscillator = ctx.createOscillator()
    let dst = oscillator.connect(ctx.createMediaStreamDestination())
    oscillator.start()
    ctx.resume()
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
  }
  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), { width, height })
    canvas.getContext('2d').fillRect(0, 0, width, height)
    let stream = canvas.captureStream()
    return Object.assign(stream.getVideoTracks()[0], { enabled: false })
  }

  let getUserMedia = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("getUserMedia not available, cannot access camera/microphone.");
      return;
    }

    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => { })
        .catch((e) => console.log(e))
    } else {
      try {
        let tracks = localVideoref.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
      } catch (e) { }
    }
  }


  let getDislayMediaSuccess = (stream) => {
    console.log("HERE")
    try {
      window.localStream.getTracks().forEach(track => track.stop())
    } catch (e) { console.log(e) }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue

      connections[id].addStream(window.localStream)

      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description)
          .then(() => {
            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
          })
          .catch(e => console.log(e))
      })
    }

    stream.getTracks().forEach(track => track.onended = () => {
      setScreen(false)

      try {
        let tracks = localVideoref.current.srcObject.getTracks()
        tracks.forEach(track => track.stop())
      } catch (e) { console.log(e) }

      let blackSilence = (...args) => new MediaStream([black(...args), silence()])
      window.localStream = blackSilence()
      localVideoref.current.srcObject = window.localStream

      getUserMedia()

    })
  }



  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [video, audio])




  let gotMessagesFromServer = (fromId, message) => {
    var signal = JSON.parse(message)

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
          if (signal.sdp.type === 'offer') {
            connections[fromId].createAnswer().then((description) => {
              connections[fromId].setLocalDescription(description).then(() => {
                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
              }).catch(e => console.log(e))
            }).catch(e => console.log(e))
          }
        }).catch(e => console.log(e))
      }

      if (signal.ice) {
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
      }
    }
  }

  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data }
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on('signal', gotMessagesFromServer);

    socketRef.current.on('connect', () => {

      socketRef.current.emit("join-call", { path: window.location.href, username });

      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage)

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter(video => video.socketId !== id))
      })

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((client) => {
            const socketListId = client.socketId;
            const participantName = client.username || `Participant`;
            if (socketListId === socketRef.current.id) return;
            if (connections[socketListId]) return;

            connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
            connections[socketListId].onicecandidate = (event) => {
              if (event.candidate !== null) {
                socketRef.current.emit("signal", socketListId, JSON.stringify({ "ice": event.candidate }));
              }
            }

            connections[socketListId].onaddstream = (event) => {
              let videoExits = videoRef.current.find(video => video.socketId === socketListId);

              if (videoExits) {
                setVideos((videos) => {
                  const updatedVideos = videos.map((video) =>
                    video.socketId === socketListId ? { ...video, stream: event.stream, username: participantName } : video
                  );
                  videoRef.current = updatedVideos;
                  return updatedVideos;

                });
              } else {
                let newVideo = {
                  socketId: socketListId,
                  stream: event.stream,
                  username: participantName,
                  autoPlay: true,
                  playsInline: true
                }
                setVideos(videos => {
                  const updatedVideos = [...videos, newVideo];
                  videoRef.current = updatedVideos;
                  return updatedVideos;
                });
              }
            };
          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            // TODO blackSilence
            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            connections[socketListId].addStream(window.localStream);
          }

        })

        if (id === socketRef.current.id) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue

            connections[id2].createOffer().then((description) => {
              connections[id2].setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit("signal", id2, JSON.stringify({ "sdp": connections[id2].localDescription }));
                }).catch((e) => {
                  console.log(e);
                })
            })
          }
        }
      })
    })
  }

  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  }

  let routeTo =  useNavigate();

  let handleVideo = () => {
    setVideo(!video);
  }

  let handleAudio = () => {
    setAudio(!audio);
  }

  let connect = () => {
    setAskForUsername(false);
    getMedia();
  }

  let handleLobbyKeyDown = (e) => {
    if (e.key === "Enter" && username.trim()) connect();
  }



  let getDisplayMedia = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      console.warn("Display media API not available. Screen sharing may require HTTPS or secure context.");
      return;
    }

    if (screen) {
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        .then(getDislayMediaSuccess)
        .then((stream) => { })
        .catch((e) => console.log(e))
    }
  }

  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen])

  let handleScreen = () => {
    setScreen(!screen);
  }

  let sendMessage = () => {
    if (!message.trim()) return;
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  }

  let handleChatKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  }

  let handleEndCall = () => {
      try {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach(track => track.stop())
      }catch(e){ console.log(e)}

      routeTo("/home");
  }

  const remoteCount = videos.length;

  return (
    <div>
      {askForUsername === true ? (
        /* ================= LOBBY ================= */
        <div className={styles.lobbyContainer}>
          <div className={styles.lobbyContent}>
            <div className={styles.lobbyHeader}>
              <h2>Join</h2>
              <p>Type your name and tap join.</p>
            </div>

            <div className={styles.lobbyVideoPreview}>
              <video ref={localVideoref} autoPlay muted playsInline />
            </div>
            <div className={styles.lobbyVideoLabel}>
              Preview
            </div>

            <div className={styles.lobbyInputSection}>
              <div className={styles.lobbyInput}>
                <input
                  className={styles.lobbyTextField}
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={handleLobbyKeyDown}
                  placeholder="Name"
                />
              </div>

              <Button
                className={styles.lobbyButton}
                variant="contained"
                onClick={connect}
                disabled={!username.trim()}
              >
                Join
              </Button>

              <p className={styles.infoText}>
                {username.trim() ? 'Tap join when you are ready.' : 'Enter your name to continue.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ================= MEETING UI ================= */
        <div className={styles.meetVideoContainer}>

          {showModal ? <div className={styles.chatRoom}>
            <div className={styles.chatContainer}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1>Chat</h1>
                <button
                  onClick={() => setModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.4rem',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    lineHeight: 1
                  }}
                  aria-label="Close chat"
                >✕</button>
              </div>
              <div className={styles.chattingDisplay}>

                {messages.length !== 0 ? messages.map((item, index) => {

                  return (
                    <div className={styles.chatMessage} key={index}>
                      <p className={styles.chatMessageSender}>{item.sender}</p>
                      <p className={styles.chatMessageBody}>{item.data}</p>
                    </div>
                  )
                }) : <p>No Messages Yet</p>}


              </div>
              <div className={styles.chattingArea}>
                <input
                  className={styles.chatInput}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Type your message"
                />
                <button
                  className={styles.chatSendButton}
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  aria-label="Send message"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div> : <></>}

          {/* ===== TOP CONTROLS ===== */}
          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>

            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable === true ? (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
              </IconButton>
            ) : null}

            <Badge badgeContent={newMessages} max={999} color="secondary">
              <IconButton onClick={() => setModal(!showModal)} style={{ color: "white" }}>
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          <div className={styles.meetingStage}>
            <div className={styles.videoCard}>
              <div className={styles.videoCardHeader}>{username ? `You (${username})` : 'You'}</div>
              <div className={styles.videoCardContent}>
                <video
                  className={styles.meetUserVideo}
                  ref={localVideoref}
                  autoPlay
                  muted
                />
              </div>
            </div>

            {remoteCount > 0 ? (
              videos.map((remote, index) => (
                <div className={styles.videoCard} key={remote.socketId}>
                  <div className={styles.videoCardHeader}>{remote.username || `Participant ${index + 1}`}</div>
                  <div className={styles.videoCardContent}>
                    <video
                      data-socket={remote.socketId}
                      ref={(ref) => {
                        if (ref && remote.stream) {
                          ref.srcObject = remote.stream;
                        }
                      }}
                      autoPlay
                      playsInline
                      className={styles.remoteVideoFrame}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.videoCard}>
                <div className={styles.videoCardHeader}>Waiting for participants</div>
                <div className={styles.videoCardContent}>
                  <div className={styles.placeholderCard}>
                    <p>Waiting for other participants...</p>
                    <span>Invite people to the same meeting link so they can join.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );

}
