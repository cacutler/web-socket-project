const express = require("express")
const app = express()
const WebSocket = require("ws")
app.use(express.static("public"))
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
    ws.on("error", function (error) {
        console.error("connection error:", error)
    })
    myClients.push(ws)
    sendActionToAllClients({
        action: "updateBoard",
        board: board,
        turn: "white",
        currentPlayer: "player 1"
    })
    if (myClients.length > 2) {
        ws.close()
    }
    var message = ""
    var players = []
    if (myClients.length === 1) {
        message = "player 1 connected"
        players = ["player 1"]
    }
    if (myClients.length === 2) {
        message = "player 2 connected"
        players = ["player 1", "player 2"]
    }
    sendActionToAllClients({
        connection_message: message,
        action: "connect",
        players: players
    })
    ws.on("message", function (data, isBinary) {
        var message = JSON.parse(data)
        if (message.action === "move") {
            board[message.position[0]][message.position[1]] = message.piece
        }
        if (message.action === "pickup") {
            board[message.position[0]][message.position[1]] = ""
        }
        console.log(message);
        sendActionToAllClients({
            action: "updateBoard",
            board: board,
            currentPlayer: message.currentPlayer,
            turn: message.turn
        })
    })
})