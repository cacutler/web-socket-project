const express = require("express")
const app = express()
const WebSocket = require("ws")
app.use(express.static("public"))
var myClients = new Set();
var server = app.listen(8080, function () {
    console.log("Server is running...")
})
const wss = new WebSocket.WebSocketServer({server: server})
var board = [["lbr.png", "lbk.png", "lbb.png", "bq.png", "bk.png", "rbb.png", "rbk.png", "rbr.png"], ["bp1.png", "bp2.png", "bp3.png", "bp4.png", "bp5.png", "bp6.png", "bp7.png", "bp8.png"], ["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""], ["", "", "", "", "", "", "", ""], ["wp1.png", "wp2.png", "wp3.png", "wp4.png", "wp5.png", "wp6.png", "wp7.png", "wp8.png"], ["lwr.png", "lwk.png", "lwb.png", "wq.png", "wk.png", "rwb.png", "rwk.png", "rwr.png"]]
var currentTurn = "w"
var players = new Map()

function sendActionToAllClients(actionObject) {
    var message = JSON.stringify(actionObject)
    myClients.forEach(function (client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message)
        }
    })
}

function isValidPosition(position) {
    return Array.isArray(position) &&
        position.length === 2 &&
        Number.isInteger(position[0]) &&
        Number.isInteger(position[1]) &&
        position[0] >= 0 && position[0] < 8 &&
        position[1] >= 0 && position[1] < 8
}

function pieceColor(piece) {
    if (typeof piece !== "string" || piece.length === 0) {
        return ""
    }
    return piece.charAt(0)
}

function sendError(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            action: "error",
            message: message,
            currentTurn: currentTurn
        }))
    }
}

wss.on("connection", function (ws) {
    ws.on("error", function (error) {
        console.error("connection error:", error)
    })
    if (myClients.size >= 2) {
        ws.close()
        return
    }

    myClients.add(ws)
    var occupiedNumbers = new Set(Array.from(players.values()).map(function (player) {
        return player.number
    }))
    var playerNumber = occupiedNumbers.has(1) ? (occupiedNumbers.has(2) ? 1 : 2) : 1
    var color = playerNumber === 1 ? "w" : "b"
    players.set(ws, {
        number: playerNumber,
        color: color,
        heldPiece: "",
        heldPosition: null
    })

    ws.on("close", function () {
        var departingPlayer = players.get(ws)
        if (departingPlayer && departingPlayer.heldPosition) {
            var heldRow = departingPlayer.heldPosition[0]
            var heldCol = departingPlayer.heldPosition[1]
            if (board[heldRow][heldCol] === "") {
                board[heldRow][heldCol] = departingPlayer.heldPiece
            }
        }
        myClients.delete(ws)
        players.delete(ws)
        sendActionToAllClients({
            action: "connect",
            connection_message: "waiting for player",
            players: myClients.size === 1 ? ["player 1"] : [],
            currentTurn: currentTurn
        })
        sendActionToAllClients({
            action: "updateBoard",
            board: board,
            currentTurn: currentTurn,
            turn: currentTurn
        })
    })

    ws.send(JSON.stringify({
        action: "updateBoard",
        board: board,
        currentTurn: currentTurn,
        turn: currentTurn
    }))

    if (playerNumber === 1) {
        ws.send(JSON.stringify({
            connection_message: "player 1 connected",
            action: "connect",
            player: 1,
            playerNumber: 1,
            color: "w",
            currentTurn: currentTurn,
            turn: currentTurn,
            players: ["player 1"]
        }))
    } else {
        sendActionToAllClients({
            connection_message: "player 2 connected",
            action: "connect",
            players: ["player 1", "player 2"],
            currentTurn: currentTurn,
            turn: currentTurn
        })
        ws.send(JSON.stringify({
            connection_message: "player 2 connected",
            action: "connect",
            players: ["player 1", "player 2"],
            player: 2,
            playerNumber: 2,
            color: "b",
            currentTurn: currentTurn,
            turn: currentTurn
        }))
    }

    ws.on("message", function (data, isBinary) {
        var message
        try {
            message = JSON.parse(data)
        } catch (error) {
            sendError(ws, "Invalid message")
            return
        }

        var player = players.get(ws)
        if (!player) {
            sendError(ws, "Player is not connected")
            return
        }

        if (message.action === "move") {
            if (pieceColor(player.heldPiece) !== currentTurn) {
                sendError(ws, "It is not your turn")
                return
            }
            if (player.color !== currentTurn) {
                sendError(ws, "It is not your turn")
                return
            }
            if (!isValidPosition(message.position) || player.heldPosition === null) {
                sendError(ws, "Invalid move")
                return
            }

            var row = message.position[0]
            var col = message.position[1]
            var destination = board[row][col]
            if (pieceColor(destination) === player.color) {
                sendError(ws, "You cannot move onto your own piece")
                return
            }

            board[row][col] = player.heldPiece
            board[player.heldPosition[0]][player.heldPosition[1]] = ""
            player.heldPiece = ""
            player.heldPosition = null
            currentTurn = currentTurn === "w" ? "b" : "w"
        }

        if (message.action === "pickup") {
            if (player.color !== currentTurn) {
                sendError(ws, "It is not your turn")
                return
            }
            if (!isValidPosition(message.position)) {
                sendError(ws, "Invalid position")
                return
            }

            var pickupRow = message.position[0]
            var pickupCol = message.position[1]
            var piece = board[pickupRow][pickupCol]
            if (pieceColor(piece) !== player.color) {
                sendError(ws, "You can only pick up your own pieces")
                return
            }

            player.heldPiece = piece
            player.heldPosition = [pickupRow, pickupCol]
            board[pickupRow][pickupCol] = ""
        }

        sendActionToAllClients({
            action: "updateBoard",
            board: board,
            currentTurn: currentTurn,
            turn: currentTurn
        })
    })
})