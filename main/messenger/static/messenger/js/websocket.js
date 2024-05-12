URL = window.location.href
URL = URL.split('/')
URL = 'ws://' + URL[2] + '/ws'
console.log(URL)

let websocket = new WebSocket(URL)
function connect() {
    websocket = new WebSocket(URL)

    websocket.onopen = function () {
        console.log('client says connection opened')
        websocket.send(JSON.stringify({request: 'connect'}))
        REQUESTS.requestMyUser()
        REQUESTS.requestRooms()
        REQUESTS.requestAllUsers()
    };

    websocket.onmessage = function (event) {
        try {
            const data = JSON.parse(event.data)
            websocketDataHandler(data)
        } catch (err) {
            console.log('Error inside websocketDataHandler(): ', err);
        }
    };

    websocket.onclose = function (event) {
        console.log('Socket is closed. Reconnect will be attempted in 1 second.', event.reason);
        setTimeout(function () {
            connect();
        }, 1000);
    };

    websocket.onerror = function (error) {
        console.error('Socket encountered error: ', error.message, 'Closing socket');
        websocket.close();
    };
}
connect()