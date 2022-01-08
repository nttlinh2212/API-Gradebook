import WebSocket, { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import url from 'url';
const WS_PORT = process.env.PORT;



export default function createWs(server) {
    const wss = new WebSocketServer({
        server
        //port: WS_PORT,
    });
    console.log('new wss');
    var wsClients = new Map();
    //var wsClients_userId = [];
    wss.on('connection', function connection(ws, req) {
        var token = url.parse(req.url, true).query.token;
    
        var wsUserId = '';
    
        jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
            if (err) {
                ws.close();
            } else {
                wsClients.set(token, ws);
                //wsClients[token] = ws;
                // const newObj = {
                //     ws,
                //     wsUserId
                // }
                wsUserId = decoded.userId;
                ws.userId = wsUserId;
                //wsClients_userId.push(newObj);
            }
        });
        console.log(`Client ${wsUserId} connects successfully.`);
    
        ws.on('message', function (data) {
            //console.log('received: %s', message);
            for (const [token, client] of wsClients.entries()) {
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
}

export function broadcastAll(event, data, userId) {
    //console.log("userId",userId)
    data.event = event;
    userId = userId + '';
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            //&&client.id === userId
            //console.log("ClientID:",client.userId);
            if (client.userId === userId) client.send(JSON.stringify(data));
        }
    });
    // for (const obj of wsClients_userId) {
    //     const {id,client} = obj;
    //     if (client.readyState === WebSocket.OPEN && id === userId) {
    //         client.send(data, { binary: isBinary });
    //     }
    // }
    // for (const [id, client] of Object.entries(wsClients)) {
    //     if (id === userId) {
    //         client.send(data, { binary: isBinary });
    //     }
    // }
}

