Vue.createApp({
    data: function () {
        return {
            boardState: [],
            player: {turnType: ""},
            socket: null,
            piece: "",
            players: [],
            ableToPlay: false
        };
    },
    methods: {
        move: function (row, col) {
            if (this.piece !== "") {
                var message = {
                    action: "move",
                    position: [row, col],
                    piece: this.piece
                };
                this.piece = "";    
                console.log("move message:", message);
                this.sendMessage(message);
            } else if (this.piece === "") {
                var temp_board = JSON.parse(JSON.stringify(this.boardState));
                this.piece = temp_board[row][col];
                temp_board[row][col] = "";
                this.boardState = temp_board;
                var message = {
                    action: "pickup",
                    position: [row, col]
                };
                console.log("Pickup message:", message);
                this.sendMessage(message);
            }
        },
        sendMessage: function (data) {
            this.socket.send(JSON.stringify(data));
        },
        receiveMessage: function (data) {
            if (data.action === "updateBoard") {
                this.boardState = data.board;
            }
            if (data.action === "connect") {
                if (data.connection_message === "player 1 connected") {
                    this.players = data.players;
                }
                if (data.connection_message === "player 2 connected") {
                    this.players = data.players;
                    this.ableToPlay = true;
                }
            }
        }
    },
    created: function () {
        this.socket = new WebSocket("wss://websocket-chess.onrender.com");
        this.socket.onmessage = (event) => {
            console.log("event player data:", event.data);
            this.receiveMessage(JSON.parse(event.data));
        };
    }
}).mount("#app");