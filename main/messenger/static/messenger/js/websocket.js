URL = window.location.href
URL = URL.split('/')
URL = 'ws://' + URL[2] + '/ws'
console.log(URL)
const websocket = new WebSocket(URL)

websocket.onopen = function () {
    console.log('client says connection opened')
    websocket.send(JSON.stringify({request:'connect'}))
    REQUESTS.requestMyUser()
    REQUESTS.requestRooms()
    REQUESTS.requestAllUsers()
};

websocket.onmessage = function (event) {
    // try {
        const data = JSON.parse(event.data)
        websocketDataHandler(data)
    // } catch (e) {
    //     console.log('Error:', e.message);
    // }
};

websocket.onclose = function (event) {
    if (event.wasClean) {
        alert('Соединение закрыто чисто');
    }
    // else {
    //     alert('Обрыв соединения'); // например, "убит" процесс сервера
    // }
    alert('Код: ' + event.code + ' причина: ' + event.reason);
};

websocket.onerror = function (error) {
    alert("Ошибка " + error.message);
    console.log(error);
};
