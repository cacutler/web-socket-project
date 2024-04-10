Vue.createApp({
    data: function () {
        return {
            boardState: [],
            xPosition: "",
            yPosition: "",
            playerID: Math.floor(Math.random() * 10),
            socket: null
        };
    },
    methods: {
        move: function (row, col) {
            console.log(row, col);
            var message = {
                action: "mark",
                position: [row, col],
                player: this.playerID
            };
            this.sendMessage(message);
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
    }
}).mount("#app");