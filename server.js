const express = require("express")
const app = express()
const WebSocket = require("ws")
var myClients = [];
var server = app.listen(8080, function () {
    console.log("Server is running...")
})
const wss = new WebSocket.WebSocketServer({server: server})
var board = [["LBR", "LBK", "LBB", "BQ", "BK", "RBB", "RBK", "RBR"], ["BP1", "BP2", "BP3", "BP4", "BP5", "BP6", "BP7", "BP8"], ["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""], ["WP1", "WP2", "WP3", "WP4", "WP5", "WP6", "WP7", "WP8"], ["LWR", "LWK", "LWB", "WQ", "BK", "RWB", "RWK", "RWR"]]
function sendActionToAllClients(actionObject) {
    var message = JSON.stringify(actionObject)
    myClients.forEach(function (client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message)
        }
    })
}
wss.on("connection", function (ws) {
    console.log("ws connection:", ws)
    ws.on("error", function (error) {
        console.error("connection error:", error)
    })
    myClients.push(ws)
    console.log("my client list:", myClients);
    sendActionToAllClients({
        action: "updateBoard",
        board: board
    })
    ws.on("message", function (data, isBinary) {
        console.log("data:", data);
        var message = JSON.parse(data)
        if (message.action === "move") {
            board[message.position[0]][message.position[1]] = message.piece
        }
        sendActionToAllClients({
            action: "updateBoard",
            board: board
        })
    })
})