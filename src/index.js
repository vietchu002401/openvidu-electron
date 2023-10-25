const ipcRenderer = require('electron').ipcRenderer;
const { BrowserWindow } = require('@electron/remote');

const { OpenVidu } = require('openvidu-browser');
const axios = require('axios');

var openvidu;
var session;
var publisher;
var mySessionId;

axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.headers.post["Authorization"] = "Basic T1BFTlZJRFVBUFA6MTIzNDU2";
axios.defaults.headers.get["Authorization"] = "Basic T1BFTlZJRFVBUFA6MTIzNDU2";

ipcRenderer.on('screen-share-ready', (event, message) => {
    if (!!message) {
        // User has chosen a screen to share. screenId is message parameter
        showSession();
        publisher = openvidu.initPublisher("publisher", {
            videoSource: "screen:" + message
        });
        joinSession();
    }
});

function initPublisher() {

    openvidu = new OpenVidu();

    const shareScreen = document.getElementById("screen-sharing").checked;
    if (shareScreen) {
        openScreenShareModal();
    } else {
        publisher = openvidu.initPublisher("publisher");
        joinSession();
    }
}

async function joinSession() {

    session = openvidu.initSession();
    session.on("streamCreated", function (event) {
        session.subscribe(event.stream, "subscriber");
    });

    mySessionId = document.getElementById("sessionId").value;

    try{
        const token = await getToken(mySessionId);
        console.log(token)

        await session.connect(token, { clientData: 'OpenVidu Electron' });
        showSession();
        session.publish(publisher);
    }catch (e){
        try{
            const token = await createTokenSession(mySessionId);
            await session.connect(token, { clientData: 'OpenVidu Electron' });
            showSession();
            session.publish(publisher);
        }catch (error){
            console.log(error)
        }
    }
}

function leaveSession() {
    session.disconnect();
    hideSession();
}

function showSession() {
    document.getElementById("session-header").innerText = mySessionId;
    document.getElementById("join").style.display = "none";
    document.getElementById("session").style.display = "block";
}

function hideSession() {
    document.getElementById("join").style.display = "block";
    document.getElementById("session").style.display = "none";
}

function openScreenShareModal() {
    let win = new BrowserWindow({
        parent: require('@electron/remote').getCurrentWindow(),
        modal: true,
        minimizable: false,
        maximizable: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        },
        resizable: false
    });
    require("@electron/remote").require("@electron/remote/main").enable(win.webContents);

    win.setMenu(null);
    // win.webContents.openDevTools();

    var theUrl = 'file://' + __dirname + '/modal.html'
    win.loadURL(theUrl);
}


/**
 * --------------------------------------------
 * GETTING A TOKEN FROM YOUR APPLICATION SERVER
 * --------------------------------------------
 * The methods below request the creation of a Session and a Token to
 * your application server. This keeps your OpenVidu deployment secure.
 * 
 * In this sample code, there is no user control at all. Anybody could
 * access your application server endpoints! In a real production
 * environment, your application server must identify the user to allow
 * access to the endpoints.
 * 
 * Visit https://docs.openvidu.io/en/stable/application-server to learn
 * more about the integration of OpenVidu in your application server.
 */

const APPLICATION_SERVER_URL = 'https://videocallserver.kns-cloud.com/';

async function getToken(mySessionId) {
    const sessionId = await createSession(mySessionId);
    return await createToken(sessionId);
}

async function createTokenSession(mySessionId) {
    const sessionId = await getSession(mySessionId);
    return await createToken(sessionId);
}
const createSession = async (sessionId)=>{
    const response = await axios.post(APPLICATION_SERVER_URL + 'openvidu/api/sessions/',
        {
            mediaMode: "ROUTED",
            recordingMode: "MANUAL",
            customSessionId: sessionId,
            forcedVideoCodec: "VP8",
            allowTranscoding: false,
            defaultRecordingProperties: {
                name: "MyRecording",
                hasAudio: true,
                hasVideo: true,
                outputMode: "COMPOSED",
                recordingLayout: "BEST_FIT",
                resolution: "1280x720",
                frameRate: 25,
                shmSize: 536870912,
                mediaNode: {
                    id: "media_i-0c58bcdd26l11d0sd"
                }
            },
            mediaNode: {
                id: "media_i-0c58bcdd26l11d0sd"
            }
        },
        {
            headers: { 'Content-Type': 'application/json' },
        }
    );
    return response.data.sessionId
}

async function getSession(sessionId) {
    const response = await axios.get(APPLICATION_SERVER_URL + 'openvidu/api/sessions/' + sessionId,
        {
            headers: { 'Content-Type': 'application/json' },
        }
    );
    return response.data.sessionId; // The sessionId
}

async function createToken(sessionId) {
    const response = await axios.post(APPLICATION_SERVER_URL + 'openvidu/api/sessions/' + sessionId + '/connection',{}, {
        headers: { 'Content-Type': 'application/json', },
    });
    return response.data.token; // The token
}