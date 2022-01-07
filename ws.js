import WebSocket, { WebSocketServer } from 'ws';
import url from 'url';
const WS_PORT = 9000;

const wss = new WebSocketServer({
    port: WS_PORT,
});
var wsClients = [];
var wsClients_userId = [];
wss.on('connection', function connection(ws, req) {
    var token = url.parse(req.url, true).query.token;

    var wsUserId = '';

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            ws.close();
        } else {
            wsClients[token] = ws;
            wsUserId = decoded.userId;
            wsClients_userId[wsUserId] = ws;
        }
    });
    console.log(`Client ${wsUserId} connects successfully.`);

    ws.on('message', function (data) {
        //console.log('received: %s', message);
        for (const [token, client] of Object.entries(wsClients)) {
            jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
                if (err) {
                    client.send(
                        'Error: Your token is no longer valid. Please reauthenticate.'
                    );
                    client.close();
                } else {
                    client.send(wsUserId + ': ' + data);
                }
            });
        }
    });
    ws.on('close', function close() {
        console.log(`Client ${wsUserId} disconnects.`);
    });
    //ws.send('something');
});

// socketServer.on('connection', function(client){
//     console.log("Client connects successfully.");
// })
console.log(`Websocket Server is running at ws://localhost:${WS_PORT}`);
export function broadcastAll(event, data, userId) {
    data.event = event;
    // wss.clients.forEach(function each(client) {
    //     if (client.readyState === WebSocket.OPEN) {
    //         client.send(data, { binary: isBinary });
    //     }
    // });
    for (const [id, client] of Object.entries(wsClients)) {
        if (id === userId) {
            client.send(data, { binary: isBinary });
        }
    }
}
export default wss;
