Vue.createApp({
    data: function () {
        return {
            boardState: [],
            player: {turnType: ""},
            socket: null,
            piece: "",
            players: [],
            ableToPlay: false,
            currentTurn: "w",
            previousTurn: "w",
            statusMessage: "Waiting for players..."
        };
    },
    methods: {
        move: function (row, col) {
            if (!this.ableToPlay) {
                this.statusMessage = "Waiting for both players.";
                return;
            }
            if (!this.isMyTurn()) {
                this.statusMessage = "It is not your turn.";
                return;
            }
            if (this.piece !== "") {
                var message = {
                    action: "move",
                    position: [row, col],
                    piece: this.piece
                };
                this.sendMessage(message);
            } else if (this.piece === "") {
                var temp_board = JSON.parse(JSON.stringify(this.boardState));
                var selectedPiece = temp_board[row][col];
                if (selectedPiece === "" || this.pieceColor(selectedPiece) !== this.player.turnType) {
                    this.statusMessage = "Select one of your pieces.";
                    return;
                }
                this.piece = selectedPiece;
                temp_board[row][col] = "";
                this.boardState = temp_board;
                var message = {
                    action: "pickup",
                    position: [row, col]
                };
                this.sendMessage(message);
            }
        },
        pieceColor: function (piece) {
            if (!piece) {
                return "";
            }
            return piece.charAt(0);
        },
        isMyTurn: function () {
            return this.player.turnType !== "" &&
                this.player.turnType === this.currentTurn;
        },
        sendMessage: function (data) {
            this.socket.send(JSON.stringify(data));
        },
        receiveMessage: function (data) {
            if (data.action === "updateBoard") {
                this.boardState = data.board;
                var nextTurn = data.currentTurn || data.turn || this.currentTurn;
                if (this.piece !== "" && nextTurn !== this.previousTurn) {
                    this.piece = "";
                }
                this.previousTurn = nextTurn;
                this.currentTurn = nextTurn;
                if (this.ableToPlay) {
                    this.statusMessage = this.isMyTurn() ? "Your turn" : "Opponent's turn";
                }
            }
            if (data.action === "connect") {
                this.players = data.players || this.players;
                this.currentTurn = data.currentTurn || data.turn || this.currentTurn;
                var isSecondPlayer = data.connection_message === "player 2 connected";
                if (data.playerNumber === 1 || data.color === "w") {
                    this.player.turnType = "w";
                }
                if (data.playerNumber === 2 || (isSecondPlayer && data.color === "b")) {
                    this.player.turnType = "b";
                }
                this.ableToPlay = this.players.length === 2;
                this.statusMessage = this.ableToPlay ? (this.isMyTurn() ? "Your turn" : "Opponent's turn") : "Waiting for both players...";
            }
            if (data.action === "error") {
                this.statusMessage = data.message || "Invalid move";
                this.currentTurn = data.currentTurn || this.currentTurn;
            }
        }
    },
    created: function () {
        var protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        this.socket = new WebSocket(protocol + "//" + window.location.host);
        this.socket.onmessage = (event) => {
            console.log("event player data:", event.data);
            this.receiveMessage(JSON.parse(event.data));
        };
    }
}).mount("#app");