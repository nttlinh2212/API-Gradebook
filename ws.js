import WebSocket, { WebSocketServer } from 'ws';
const WS_PORT = 9000;

const wss = new WebSocketServer({
    port: WS_PORT,
});
var wsClients = [];
wss.on('connection', function connection(ws, req) {
    var token = url.parse(req.url, true).query.token;

    var wsUserId = '';

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            ws.close();
        } else {
            wsClients[token] = ws;
            wsUserId = decoded.userId;
        }
    });
    console.log(`Client ${wsUserId} connects successfully.`);

    client.on('message', function (data) {
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

    ws.send('something');
});
// socketServer.on('connection', function(client){
//     console.log("Client connects successfully.");
// })
console.log(`Websocket Server is running at ws://localhost:${WS_PORT}`);
export function broadcastAll() {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data, { binary: isBinary });
        }
    });
}
export default wss;
