const express = require("express")
const app = express()
const WebSocket = require("ws")
app.use(express.static("public"))
var myClients = [];
var server = app.listen(8080, function () {
    console.log("Server is running...")
})
const wss = new WebSocket.WebSocketServer({server: server})
var board = [["lbr.png", "lbk.png", "lbb.png", "bq.png", "bk.png", "rbb.png", "rbk.png", "rbr.png"], ["bp1.png", "bp2.png", "bp3.png", "bp4.png", "bp5.png", "bp6.png", "bp7.png", "bp8.png"], ["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""], ["wp1.png", "wp2.png", "wp3.png", "wp4.png", "wp5.png", "wp6.png", "wp7.png", "wp8.png"], ["lwr.png", "lwk.png", "lwb.png", "wq.png", "wk.png", "rwb.png", "rwk.png", "rwr.png"]]
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
        board: board
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
        console.log(message)
        sendActionToAllClients({
            action: "updateBoard",
            board: board
        })
    })
})