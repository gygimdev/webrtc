var socket = io.connect("http://localhost:4000");

var divVideoChatLobby = document.getElementById("video-chat-lobby");
var divVideoChat      = document.getElementById("video-chat-room");
var joinButton        = document.getElementById("join");
var userVideo         = document.getElementById("user-video");
var peerVideo         = document.getElementById("peer-video");
var roomInput         = document.getElementById("roomName");

var roomName = roomInput.value;
var creator = false;
// RTCPeerConnection
var rtcPeerConnection;

var userStream;

// ICE
var iceServer = {
    iceServer: [
        // {url: "stun:stun1.1.google.com:19302"}, // public IP 가져오기
        {
            urls: 'turn:turn.focuspang.ai',
            username: 'rubis',
            credential: '4542rubis',
          },
    ]
}

const constraints = {
    audio: false,
    video: {width: 1280, height: 720},
};

// Join 버튼 클릭시
joinButton.addEventListener('click', function() {
    if(roomInput.value == "") {
        alert("Please enter the room name.");
    } else {
        console.log("::: client ::: emit - join");
        socket.emit("join", roomName);
    }
})


socket.on("created", function() {
    console.log("::: client ::: onCreated");
    creator = true;

    navigator.mediaDevices.getUserMedia(constraints)
    // onSuccess
    .then(function (stream) {

        userStream = stream;

        divVideoChatLobby.style = 'display:none';
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = function (e) {
            userVideo.play();
        }

        // Signal: ready
        console.log("::: client ::: emit - ready")
        socket.emit("ready", roomName);
    })

    // onError
    .catch(function (err) {
        alert("Couldn't Access User Media.");
    })
});

socket.on("joined", function() {
    creator = false;

    navigator.mediaDevices.getUserMedia(constraints)

    // onSuccess
    .then(function (stream) {

        userStream = stream;

        divVideoChatLobby.style = 'display:none';
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = function (e) {
            userVideo.play();
        }

        // Signal: ready
        console.log("::: client ::: emit - ready")
        socket.emit("ready", roomName);
    })

    // onError
    .catch(function (err) {
        alert("Couldn't Access User Media.");
    })
});

socket.on("full", function() {
    alert("Room is full, Can't join");
});

// Ready is an event that gets triggers by the client when he Joins the room
socket.on("ready", function() {
    if(creator) {
        console.log("::: client ::: onReady");

        // WebRTC connection is managed by RTCPeerConnection
        rtcPeerConnection = new RTCPeerConnection(iceServer); 
        console.log("::: client ::: rtcPeerConnection", rtcPeerConnection);
        rtcPeerConnection.onicecandidate = onIceCandidateFunction;
        rtcPeerConnection.ontrack = onTrackFunction;

        if (userStream instanceof MediaStream) {
            console.log("YES");
        } else {
            console.log("NO");
        }

        // send media stream to peer
        rtcPeerConnection.addTrack(userStream.getTracks().find(function (track) {
            return track.kind === 'video';
        }), userStream);

        // offer
        rtcPeerConnection.createOffer()
            .then( function (offer) {

                // set LocalDescription
                rtcPeerConnection.setLocalDescription(offer);
                console.log("::: client ::: emit - offer");
                socket.emit("offer", offer, roomName);
            })
            .catch(function (error) {
                console.log(error);
            })
    }
});

// Offer 수신자
socket.on("offer", function(offer) {
    console.log("::: client ::: onOffer");
    if(!creator) {
        // WebRTC connection is managed by RTCPeerConnection
        rtcPeerConnection = new RTCPeerConnection(iceServer);
        console.log("::: client ::: rtcPeerConnection", rtcPeerConnection);
        rtcPeerConnection.onicecandidate = onIceCandidateFunction;
        rtcPeerConnection.ontrack = onTrackFunction;

        // send media stream to peer
        rtcPeerConnection.addTrack(userStream.getTracks().find(function (track) {
            return track.kind === 'video';
        }), userStream);

        // set remote Offer
        rtcPeerConnection.setRemoteDescription(offer);

        // answer 생성
        rtcPeerConnection.createAnswer()
            .then( function (answer) {

                // set retmoteDescription
                rtcPeerConnection.setLocalDescription(answer);
                console.log("::: client ::: emit - answer");
                socket.emit("answer", answer, roomName);
            })
            .catch(function (error) {
                console.log(error);
            })
    }
});


// Answer 수신자
socket.on("answer", function(answer) {
    rtcPeerConnection.setRemoteDescription(answer);
    console.log("::: client ::: onAnswer");
});

// This triggers everytime you get back from STUN server
function onIceCandidateFunction(event) {
    console.log("::: client ::: trigger - onCandidate");

    if (event.candidate) {
        console.log("::: client ::: emit - candidate");
        socket.emit("candidate", event.candidate, roomName);
    }

};

// This triggers when we start to get media stream from the peer
function onTrackFunction(event) {
    console.log("::: client ::: trigger - onTrack")
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = function (e) {
        peerVideo.play();
    }
};


// Candidate 수신
socket.on("candidate", function(candidate) {
    console.log("::: client ::: onCandidate");
    var iceCandidate = new RTCIceCandidate(candidate);
    console.log("::: 후보자", iceCandidate);
    rtcPeerConnection.addIceCandidate(iceCandidate);
});