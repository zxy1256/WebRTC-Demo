'use strict';

var isChannelReady = false;
var isStarted = false;
var localStream;
var localVideo = document.querySelector('#localVideo');
var pc;

// MARK: Socket
var socket = io.connect();

socket.emit('camera connect');
console.log('Attempted to connect camera');

socket.on('camera connected', function () {
    console.log('Camera connected');
});

socket.on('viewer connected', function () {
    isChannelReady = true;
    console.log('Channel is ready!')
    maybeStart()
});

socket.on('log', function (array) {
    console.log.apply(console, array);
});

function sendMessage(message) {
    console.log('Client sending message: ', message);
    socket.emit('message', message);
}

socket.on('message', function (message) {
    console.log('Client received message:', message);
    if (message === 'got user media') {
        console.log("Got user media")
        maybeStart();
    } else if (message.type === 'answer' && pc) {
        pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate' && pc) {
        var candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate
        });
        pc.addIceCandidate(candidate);
    } else if (message === 'bye' && pc) {
        //   handleRemoteHangup();
    }
});


// MARK: PeerConnection

function maybeStart() {
    console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
    if (!pc && typeof localStream !== 'undefined' && isChannelReady) {
        console.log('>>>>>> creating peer connection');
        createPeerConnection();
        pc.addStream(localStream);
        isStarted = true;
        doCall();
    }
}


function createPeerConnection() {
    try {
      pc = new RTCPeerConnection(null);
      pc.onicecandidate = handleIceCandidate;
      // pc.onremovestream = handleRemoteStreamRemoved;
      console.log('Created RTCPeerConnnection');
    } catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
      return;
    }
}

function handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
      sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      });
    } else {
      console.log('End of candidates.');
    }
}

// function handleRemoteStreamAdded(event) {
//     console.log('Remote stream added.');
//     remoteStream = event.stream;
//     remoteVideo.srcObject = remoteStream;
// }

function doCall() {
    console.log('Sending offer to peer');
    pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function setLocalAndSendMessage(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(sessionDescription);
}

function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
}

navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true
}).then(gotStream)
    .catch(function (e) {
        alert('getUserMedia() error: ' + e.name);
    });


function gotStream(stream) {
    console.log('Adding local stream.');
    localStream = stream;
    localVideo.srcObject = stream;
    sendMessage('got user media');
    // if (isInitiator) {
    //   maybeStart();
    // }
}

