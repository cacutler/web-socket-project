const express = require("express")
const app = express()
const WebSocket = require("ws")
var myClients = [];
var server = app.listen(8080, function () {
    console.log("Server is running...")
})
const wws = new WebSocket.WebSocketServer({server: server})
var boardState = []
function sendActionToAllClients(actionObject) {
    var message = JSON.stringify(actionObject)
    wws.clients.forEach(function (client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message)
        }
    })
}
wws.on("connection", function (ws) {
    myClients.push(ws)
    sendActionToAllClients({
        action: "updateBoard",
        board: boardState
    })
})