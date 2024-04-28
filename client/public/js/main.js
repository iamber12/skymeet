
const grid = document.getElementById("video-grid");
const localVideo = document.getElementById("localVideo");

const rtcConfig = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
var messageInput = document.getElementById("messageInput")
var messageBox = document.getElementById('messageBox');

let stream, ws
let rtcPeerConns = new Map()

const buttons = {
  exitButton: document.getElementById("exitButton"),
  copyButton: document.getElementById("copyButton"),
  sendButton: document.getElementById("sendButton")
};

const buttonHandlers = {
  exitButton: { handler: exitRoom, enabled: true },
  copyButton: { handler: copyToClipBoard, enabled: true },
  sendButton: { handler: sendMessage, enabled: true }
};

Object.entries(buttonHandlers).forEach(([buttonName, { handler, enabled, hidden }]) => {
  const button = buttons[buttonName];
  if (button) {
    button.disabled = !enabled;
    button.addEventListener("click", handler);
    if(hidden) {
      button.setAttribute("hidden", "hidden");
    }
  }
});

async function copyToClipBoard() {
  let textToCopy = document.getElementById("textToCopy").value
  await navigator.clipboard.writeText(textToCopy);
  Swal.fire({
    position: 'top',
    text: "Copied",
    showConfirmButton: false,
    timer: 1000,
    width: '150px'
  })
}

async function init() {
  await start()
  await connectToPeers()
}

async function start() {
  try {
    // get user media and start streaming
    const localStream = await navigator.mediaDevices.getUserMedia({audio: true, video: true})
    localVideo.srcObject = localStream
    stream = localStream
  }
  catch (e) {
    console.error(e)
  }
}

function handleWsOpen(event) {
  // Send join message to peer
  ws.send(JSON.stringify({Data: {join: true}}))
}

function handleWsMessage(event) {
  let wsMsg = JSON.parse(event.data)

  if(wsMsg.Data.join) {
    handleJoin(wsMsg)
  }
  else if(wsMsg.Data.offer) {
    handleOffer(wsMsg)
  }
  else if(wsMsg.Data.answer) {
    handleAnswer(wsMsg)
  }
  else if(wsMsg.Data.iceCandidate) {
    // add candidate
    handleAddIceCandidate(wsMsg)
  }
  else if(wsMsg.Data.chat) {
    handleChatMessage(wsMsg)
  }
  else if(wsMsg.Data.exit) {
    removeVideoFeed(wsMsg.PeerId)
  }
}

function handleWsClose(event) {
  // stop local stream
  localVideo.srcObject.getTracks().forEach(track => track.stop())
}

function handleWsError(event) {
  console.error(event.error)
}

async function handleJoin(msg) {
  let peer = createPeerConnection()
  rtcPeerConns.set(msg.PeerId, peer)
  addVideoElem(msg.PeerId)

  // create offer
  let offer = await createOffer(peer)
  await setOffer(peer, offer)
  ws.send(JSON.stringify({
    To: msg.PeerId,
    Data: {offer: offer}
  }))
}

async function handleOffer(msg) {
  let peer = createPeerConnection()
  rtcPeerConns.set(msg.PeerId, peer)
  addVideoElem(msg.PeerId)
  await addOffer(peer, msg.Data.offer)
  let answer = await createAnswer(peer)
  await addAnswer(peer, answer)

  ws.send(JSON.stringify({
    To: msg.PeerId,
    Data: {answer: answer}
  }))
}

async function handleAnswer(msg) {
    await setAnswer(rtcPeerConns.get(msg.PeerId), msg.Data.answer)
}

function createPeerConnection() {
  let rtcPeer = new RTCPeerConnection(rtcConfig)
  rtcPeer.onicecandidate = onIceCandidate
  rtcPeer.ontrack = onRemoteTrack
  rtcPeer.oniceconnectionstatechange = onIceCandidateStateChange

  // add peer's stream to local stream
  stream.getTracks().forEach(track => rtcPeer.addTrack(track, stream))
  return rtcPeer
}

async function handleAddIceCandidate(msg) {
  try {
    await rtcPeerConns.get(msg.PeerId).addIceCandidate(msg.Data.iceCandidate)
  }
  catch (e) {
    console.error(e)
  }
}

function onIceCandidate(event) {
  let peerId

  rtcPeerConns.forEach((peer, id) => {
    if(peer == this) {
      peerId = id;
    }
  })

  if(event.candidate) {
    ws.send(JSON.stringify( {
      To: peerId,
      Data: {iceCandidate: event.candidate}
    }))
  }
}

function onRemoteTrack(event) {
  let peerId
  rtcPeerConns.forEach((peer, id) => {
    if(peer==this) {
      peerId = id
    }
  })

  let remoteVideo = document.getElementById(peerId)
  if(checkUndefinedOrNull(remoteVideo)) {
    addVideoElem(peerId)
  }
  remoteVideo.srcObject = event.streams[0]
}

function onIceCandidateStateChange(event) {
  if(this.iceConnectionState=="closed") {
    removePeerConn(this)
  }
}

async function createOffer(peer) {
  try {
    return await peer.createOffer({
      offerToReceiveAudio: 1,
          offerToReceiveVideo: 1
    })
  }
  catch(e) {
    console.error(e)
  }
}

async function setOffer(peer, offer) {
  try {
    await peer.setLocalDescription(offer)
  }
  catch(e) {
    console.error(e)
  }
}

async function addOffer(peer, offer) {
  try {
    console.log("setting remote description in offer ")
    await peer.setRemoteDescription(new RTCSessionDescription(offer))
  }
  catch (e) {
    console.error(e)
  }
}

async function createAnswer(peer) {
  try {
    return await peer.createAnswer()
  }
  catch (e) {
    console.error(e)
  }
}

async function addAnswer(peer, answer) {
  try {
    await peer.setLocalDescription(answer)
  }
  catch (e) {
    console.error(error)
  }
}

async function setAnswer(peer, answer) {
  try {
    console.log("setting remote description in answer ")
    await peer.setRemoteDescription(new RTCSessionDescription(answer))
  }
  catch (e) {
    console.error(e)
  }
}

function addVideoElem(peerId) {
  let grid = document.getElementById("video-grid");
  let div = document.createElement("div");
  let video = document.createElement("video");
  let name = document.createElement("p");

  div.classList.add("video-box");
  name.classList.add("clientName");
  name.innerText = peerId;

  video.setAttribute("id", peerId);
  video.setAttribute("playsinline", "");
  video.setAttribute("autoplay", "");
  video.setAttribute("muted", "");

  div.appendChild(name);
  div.appendChild(video);
  grid.appendChild(div);
}

async function removePeerConn(peer) {
  let peerId
  rtcPeerConns.forEach((p, id) => {
    if(peer == p) {
      peerId = id
      removeVideoFeed(id)
    }
  })
  if(peer!=null) {
    peer.close()
    peer = null
  }

  rtcPeerConns.delete(peerId)
}

function removeVideoFeed(id) {
  // remove stream of peer
  let remVideo = document.getElementById(id)
  if(!checkUndefinedOrNull(remVideo)){
    remVideo.srcObject.getTracks().forEach(track => track.stop())
    remVideo.parentElement.remove()
  }
}

function removeRTCPeerConns() {
  rtcPeerConns.forEach((peer, id) => {
    removeVideoFeed(id)
    peer.close()
    peer = null
    rtcPeerConns.delete(id)
  })
}

function createAndHandleWebsocketConnection(roomId, username) {
  let wsURL = "ws://" + location.host + "/ws?id=" + roomId + "&username=" + username
  ws = new WebSocket(wsURL)
  ws.onopen = handleWsOpen
  ws.onmessage = handleWsMessage
  ws.onclose = handleWsClose
  ws.onerror = handleWsError
}

async function connectToPeers() {
  let params = new URLSearchParams(window.location.search)
  let roomId = params.get("id")
  let username = params.get("username")
  createAndHandleWebsocketConnection(roomId, username)
}

function sendMessage(event) {
  if(!ws || ws.readyState!= WebSocket.OPEN) {
    console.error("WebSocket isn't open. Unable to send message.");
    return
  }
  ws.send(JSON.stringify({
    from: "test",
    Data: {message: messageInput.value, chat: true}
  }))
  messageInput.value = ""
}

function handleChatMessage(msg) {
  var messageElement = document.createElement('div');
  messageElement.textContent = msg.PeerId + ': ' + msg.Data.message;
  messageBox.appendChild(messageElement);
  messageBox.scrollTop = messageBox.scrollHeight;
}

function checkUndefinedOrNull(elem) {
  return elem == null || elem == undefined
}

async function exitRoom() {
  ws.send(JSON.stringify({Data: {exit: true}}))
  removeRTCPeerConns()
  if(ws!=null) {
    ws.close()
    ws = null
  }
  window.location.replace(location.protocol+ "//" +location.host);
}