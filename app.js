Vue.createApp({
    data: function () {
        return {
            boardState: [],
            playerID: Math.floor(Math.random() * 10),
            socket: null,
            black: false,
            white: false,
            piece: ""
        };
    },
    methods: {
        move: function (row, col) {
            if (this.piece !== "") {
                var message = {
                    action: "move",
                    position: [row, col],
                    player: this.playerID,
                    white: this.white,
                    black: this.black,
                    piece: this.piece
                };
                this.sendMessage(message);
                if (this.white) {
                    this.white = false;
                    this.black = true;
                } else {
                    this.black = false;
                    this.white = true;
                }
            } else if (this.piece === "") {
                var temp_board = JSON.parse(JSON.stringify(this.boardState));
                this.piece = temp_board[row][col];
                temp_board[row][col] = "";
                this.boardState = temp_board;
                var message = {
                    action: "pickup",
                    position: [row, col]
                };
                this.sendMessage(message);
            }
        },
        sendMessage: function (data) {
            //handle new incoming WS message
            this.socket.send(JSON.stringify(data));
        },
        receiveMessage: function (data) {
            //send message to WS server
            if (data.action == "updateBoard") {
                //do something for some action
                this.boardState = data.board;
            }
        }
    },
    created: function () {
        this.socket = new WebSocket("ws://localhost:8080");
        this.socket.onmessage = (event) => {
            this.receiveMessage(JSON.parse(event.data));
        };
        if (this.playerID % 2 === 1) {
            this.white = true;
            this.black = false;
        } else {
            this.white = false;
            this.black = true;
        }
    }
}).mount("#app");