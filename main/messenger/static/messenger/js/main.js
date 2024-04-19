const baseURL = window.location.protocol + "//" + window.location.host + "/"
console.log(baseURL)
const bodyElement = document.getElementsByTagName('body')[0]
const roomsDiv = document.getElementById('rooms')
const messageDiv = document.getElementById('messages')
const groupNameElement = document.getElementById('groupDataDisplay')

const groupDataDisplay = document.getElementById('groupDataDisplay')
const overlay = document.getElementById('overlay')

const DATA = {
    userData: {},
    currentRoom: {
        id: null,
        name: '',
        users: [],
        messages: [],
        text: '',
        files: [],
    },
    rooms: [],
    allUsers: [],
    clearCurrentRoomData() {
        this.currentRoom = {
            id: null,
            name: '',
            users: [],
            messages: [],
            text: '',
            files: [],
        }
    }
}

const INPUT = {
    textInputElement: document.getElementById('input'),
    /**
     * roomId: {
     *     text: string of input
     *     files: [] of files
     * }
     */
}
INPUT.textInputElement.addEventListener('keydown', function (e) {
    const keyCode = e.which || e.keyCode;
    if (DATA.currentRoom.id !== null){
        if (INPUT[DATA.currentRoom.id]){
            INPUT[DATA.currentRoom.id]["text"] = INPUT.textInputElement.value
        } else {
            INPUT[DATA.currentRoom.id] = {
                text: INPUT.textInputElement.value,
                files: []
            }
        }

    }
    if (keyCode === 13 && !e.shiftKey) {
        e.preventDefault();
        sendMessage(DATA.currentRoom.id)
        INPUT.textInputElement.value = ""
    }
});

function sortMessagesByTime() {
    DATA.currentRoom.messages.sort((mes1, mes2) => {
        const time1 = parseInt(mes1.timestamp)
        const time2 = parseInt(mes2.timestamp)
        if (time1 > time2) {
            return 1
        } else if (time2 > time1) {
            return -1
        } else {
            return 0
        }
    })
}

function sendMessage() {
    if (DATA.currentRoom.id !== null) {
        websocket.send(JSON.stringify({
            message: INPUT.textInputElement.value,
            room: DATA.currentRoom.id,
            request: "send_message"
        }))
    }

}


const REQUESTS = {
    requestRooms() {
        console.log('from-user', {request: 'groups'})
        websocket.send(JSON.stringify(
            {request: 'groups'}
        ))
    },
    requestRoomData() {
        console.log('from-user', {
            request: 'group_data',
            room_id: DATA.currentRoom.id
        })
        websocket.send(JSON.stringify(
            {
                request: 'group_data',
                room_id: DATA.currentRoom.id
            }
        ))
    },
    requestMyUser() {
        console.log('from-user', {request: 'user'})
        websocket.send(JSON.stringify(
            {request: 'user'}
        ))
    },
    requestAllUsers() {
        console.log('from-user', {request: "users"})
        websocket.send(JSON.stringify(
            {request: "users"}
        ))
    },
    requestRenameRoom(roomId, newName) {
        console.log('from-user', {
            request: 'rename_room',
            room_id: roomId,
            name: newName,
        })
        websocket.send(JSON.stringify(
            {
                request: 'rename_room',
                room_id: roomId,
                name: newName,
            }
        ))
    },
    requestInviteUser(userId, roomId) {
        console.log('from-user', {
            request: "invite",
            user_id: userId,
            room_id: roomId,
        })
        websocket.send(JSON.stringify(
            {
                request: "invite",
                user_id: userId,
                room_id: roomId,
            }
        ))
    },
    requestKickUser(userId, roomId) {
        console.log('from-user', {
            request: "kick",
            user_id: userId,
            room_id: roomId,
        })
        websocket.send(JSON.stringify(
            {
                request: "kick",
                user_id: userId,
                room_id: roomId,
            }
        ))
    },
    requestLeaveRoom() {
        console.log('from-user', {
            request: "leave",
            user_id: DATA.userData.id,
            room_id: DATA.currentRoom.id,
        })
        websocket.send(JSON.stringify(
            {
                request: "leave",
                user_id: DATA.userData.id,
                room_id: DATA.currentRoom.id,
            }
        ))
    },
    requestDeleteRoom() {
        console.log('from-user', {
            request: "delete_room",
            room_id: DATA.currentRoom.id,
        })
        websocket.send(JSON.stringify(
            {
                request: "delete_room",
                room_id: DATA.currentRoom.id,
            }
        ))
    },
    requestNewRoom(name, users) {
        console.log('from-user', {
            request: "new_room",
            name: name,
            creator: DATA.userData.id,
            users: users,
        })
        websocket.send(JSON.stringify(
            {
                request: "new_room",
                name: name,
                creator: DATA.userData.id,
                users: newRoomWindow.chosenUsers,
            }
        ))
    }
}

function reload(type) {
    switch (type) {
        case 'rooms':
            REQUESTS.requestRooms()
            break
        case 'room':
            REQUESTS.requestRoomData()
            break
        default:
            console.log("unrecognised reload")
    }
}

function webSocketDataHandler(data) {
    console.log('from-server:', data)
    if (data['rooms']) {
        DATA.rooms = data['rooms']
        if (!(DATA.rooms.find((room) => room.id === DATA.currentRoom.id))) {
            DATA.clearCurrentRoomData()
            showMessages()
        }
        showRooms()
        showRoomName()
    }
    if (data['users']) {
        DATA.currentRoom.users = data['users']
        if (inviteUsersWindow.open) {
            inviteUsersWindow.showUsersToInvite()
        }
        if (kickUserWindow.open) {
            kickUserWindow.showUsersToKick()
        }
    }
    if (data['messages']) {
        DATA.currentRoom.messages = data['messages']
        showMessages()
    }
    if (data['user']) {
        DATA.userData = data['user']
    }
    if (data['newMessage']) {
        DATA.currentRoom.messages.push(data['newMessage'])
        showMessages()
    }
    if (data['allUsers']) {
        DATA.allUsers = data['allUsers']
    }
    if (data['reload']) {
        reload(data['reload'])
    }

}

function showRooms() {
    roomsDiv.replaceChildren();
    for (const room in DATA.rooms) {
        const room_data = DATA.rooms[room]
        createRoomDiv(room_data)
    }
}

function createRoomDiv(room) {
    let div = document.createElement("div");
    div.className = "room"
    div.onclick = function () {
        chooseRoom(room.id)
    }
    div.id = "room_" + room.id
    div.innerHTML = 'Room ' + room.id + ' ' + room.name;
    roomsDiv.appendChild(div);
}

function createMessageDiv(message) {
    let div = document.createElement("div");
    div.className = "message"
    div.id = "message_" + message.id
    const Author = DATA.allUsers.find((user) => user.id === message.author_id_id)
    div.innerHTML = "<div class=\"message-author\">" + Author.username + "</div><div class=\"message-body\">" + message.message + "</div>"
    message.message;
    messageDiv.appendChild(div);
}

function chooseRoom(id) {
    if (DATA.currentRoom.id !== id) {
        DATA.currentRoom.id = id
        REQUESTS.requestRoomData()
        showRoomName()
    }
}

function showRoomName() {
    if (DATA.currentRoom.id !== null) {
        DATA.currentRoom.name = DATA.rooms.find((room) => room.id === DATA.currentRoom.id).name
        groupNameElement.innerHTML = DATA.currentRoom.name
    } else {
        groupNameElement.innerHTML = ''
    }
}

function showMessages() {
    // sortMessagesByTime(); Хз нужно ли это
    messageDiv.replaceChildren();
    for (const message in DATA.currentRoom.messages) {
        const message_data = DATA.currentRoom.messages[message]
        createMessageDiv(message_data)
    }
    messageDiv.scrollTop = messageDiv.scrollHeight;
}

groupDataDisplay.addEventListener('click', (event) => {
    if (DATA.currentRoom.id === null) return null
    GroupMenuWindow.openWindow()
})

overlay.addEventListener('click', (event) => {
    GroupMenuWindow.closeWindow()
    RoomRenameWindow.closeWindow()
    inviteUsersWindow.closeWindow()
    kickUserWindow.closeWindow()
    newRoomWindow.closeWindow()
    deleteConfirmWindow.closeWindow()
    overlay.classList.remove('active')
})

const GroupMenuWindow = {
    open: false,
    groupMenuWindow: document.getElementById('groupActionsWindow'),
    menuGroupName: document.getElementById('GroupMenuWindowName'),
    openWindow() {
        this.groupMenuWindow.classList.add('active')
        this.menuGroupName.innerHTML = DATA.currentRoom.name
        overlay.classList.add('active')
    },
    closeWindow() {
        this.groupMenuWindow.classList.remove('active')
    },
    renameGroup() {
        this.closeWindow()
        RoomRenameWindow.openWindow()
    },
    inviteToRoom() {
        REQUESTS.requestAllUsers()
        this.closeWindow()
        REQUESTS.requestRoomData()
        inviteUsersWindow.openWindow()

    },
    kickFromRoom() {
        REQUESTS.requestAllUsers()
        this.closeWindow()
        REQUESTS.requestRoomData()
        kickUserWindow.openWindow()
    },
    leaveRoom() {
        this.closeWindow()
        leaveConfirmWindow.openWindow()
    },
    deleteRoom() {
        this.closeWindow()
        deleteConfirmWindow.openWindow()
    },
}

const leaveConfirmWindow = {
    open: false,
    header: document.getElementById('leaveConfirmHeader'),
    window: document.getElementById("leaveConfirm"),
    openWindow() {
        this.header.innerHTML = "<span>" + "Are you sure you want to leave " + DATA.currentRoom.name + "?</span>"
        this.open = true
        overlay.classList.add('active')
        this.window.classList.add('active')
    },
    leaveRoom() {
        REQUESTS.requestLeaveRoom()
        DATA.clearCurrentRoomData()
        this.closeWindow()
        overlay.classList.remove('active')
        showRoomName()
        showMessages()
    },
    cancel() {
        this.closeWindow()
        overlay.classList.remove('active')
        GroupMenuWindow.openWindow()
    },
    closeWindow() {
        this.window.classList.remove('active')
        this.open = false
    },
}

const deleteConfirmWindow = {
    open: false,
    header: document.getElementById("deleteConfirmHeader"),
    window: document.getElementById("deleteConfirm"),
    openWindow() {
        this.header.innerHTML = "<span>" + "Are you sure you want to delete " + DATA.currentRoom.name + "?</span>" +
            "<span>Room data will not be recoverable.</span>"
        this.open = true
        overlay.classList.add('active')
        this.window.classList.add('active')
    },
    deleteRoom() {
        REQUESTS.requestDeleteRoom()
        DATA.clearCurrentRoomData()
        this.closeWindow()
        overlay.classList.remove('active')
        showRoomName()
        showMessages()
    },
    cancel() {
        this.closeWindow()
        overlay.classList.remove('active')
        GroupMenuWindow.openWindow()
    },
    closeWindow() {
        this.window.classList.remove('active')
        this.open = false
    },
}

const RoomRenameWindow = {
    open: false,
    roomMenuWindow: document.getElementById('renameRoomWindow'),
    renameWindowOldName: document.getElementById('renameWindowOldName'),
    renameRoomInput: document.getElementById('renameRoomInput'),
    saveButton: document.getElementById('renameRoomInput'),
    openWindow() {
        this.renameWindowOldName.innerHTML = "<button style='margin-left: 10px'>&larr;</button>" + "<span style='margin-left: 70px'>" + 'Rename ' + DATA.currentRoom.name + "</span>"
        const button = this.renameWindowOldName.getElementsByTagName('button')
        button.item(0).onclick = function () {
            RoomRenameWindow.closeWindow()
            GroupMenuWindow.openWindow()
        }
        this.roomMenuWindow.classList.add('active')
        overlay.classList.add('active')
        this.open = true
    },
    saveNewName() {
        if (this.renameRoomInput.value) {
            if (DATA.currentRoom.id) {
                REQUESTS.requestRenameRoom(DATA.currentRoom.id, this.renameRoomInput.value)
                RoomRenameWindow.renameRoomInput.value = ''
            }
            this.closeWindow()
            overlay.classList.remove('active')
        }
    },
    closeWindow() {
        this.roomMenuWindow.classList.remove('active')
        this.open = false
    },
}

const inviteUsersWindow = {
    open: false,
    inviteMenuWindow: document.getElementById("inviteUsersToRoom"),
    inviteToRoomName: document.getElementById("inviteToRoomName"),
    inviteUsersDiv: document.getElementById("inviteUsersDiv"),
    openWindow() {
        this.inviteToRoomName.innerHTML = "<button style='margin-left: 10px'>&larr;</button>" + "<span style='margin-left: 70px'>" + "Invite to " + DATA.currentRoom.name + "</span>"
        const button = this.inviteToRoomName.getElementsByTagName('button')
        button.item(0).onclick = function () {
            inviteUsersWindow.closeWindow()
            GroupMenuWindow.openWindow()
        }
        this.inviteMenuWindow.classList.add("active")
        this.showUsersToInvite()
        overlay.classList.add("active")
        this.open = true
    },
    closeWindow() {
        this.inviteMenuWindow.classList.remove('active')
        this.open = false
    },
    showUsersToInvite() {
        this.inviteUsersDiv.replaceChildren()
        for (const user in DATA.allUsers) {
            const userData = DATA.allUsers[user]
            if ((DATA.currentRoom.users.find((user) => user.id === userData.id) === undefined)) {
                console.log(userData)
                this.createUserDiv(userData)
            }
        }
    },
    createUserDiv(user) {
        let div = document.createElement("div");
        div.className = "user"
        div.id = "user_" + user.id
        const Name = user.username
        div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "<button id=\"inviteButton\">Invite</button>" + "</div>"
        const button = div.getElementsByTagName("button")
        button.item(0).onclick = function () {
            REQUESTS.requestInviteUser(user.id, DATA.currentRoom.id)
        }
        this.inviteUsersDiv.appendChild(div);
    },
}

const kickUserWindow = {
    open: false,
    kickWindow: document.getElementById("kickWindow"),
    kickWindowHeader: document.getElementById("kickWindowHeader"),
    kickWindowUsers: document.getElementById("kickWindowUsers"),
    openWindow() {
        console.log("kickOpens")
        this.kickWindowHeader.innerHTML = "<button style='margin-left: 10px'>&larr;</button>" + "<span style='margin-left: 70px'>" + "Kick from " + DATA.currentRoom.name + "</span>"
        const button = this.kickWindowHeader.getElementsByTagName('button')
        button.item(0).onclick = function () {
            kickUserWindow.closeWindow()
            GroupMenuWindow.openWindow()
        }
        this.kickWindow.classList.add("active")
        this.showUsersToKick()
        overlay.classList.add("active")
        this.open = true
    },
    closeWindow() {
        this.kickWindow.classList.remove('active')
        this.open = false
    },
    showUsersToKick() {
        this.kickWindowUsers.replaceChildren()
        for (const user in DATA.allUsers) {
            const userData = DATA.allUsers[user]
            if ((DATA.currentRoom.users.find((user) => user.id === userData.id) !== undefined) && (DATA.allUsers[user].id !== DATA.userData.id)) {
                console.log(userData)
                this.createUserDiv(userData)
            }
        }
    },
    createUserDiv(user) {
        let div = document.createElement("div");
        div.className = "user"
        div.id = "user_" + user.id
        const Name = user.username
        div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "<button>Kick</button>" + "</div>"
        const button = div.getElementsByTagName("button")
        button.item(0).onclick = function () {
            REQUESTS.requestKickUser(user.id, DATA.currentRoom.id)
        }
        this.kickWindowUsers.appendChild(div);
    },
}

const newRoomWindow = {
    open: false,
    window: document.getElementById("newRoom"),
    nameInput: document.getElementById("nameNewRoomInput"),
    users: document.getElementById("userToAddToNewRoom"),
    chosenUsers: [],
    openWindow() {
        REQUESTS.requestAllUsers()
        this.window.classList.add("active")
        this.showUsers()
        overlay.classList.add("active")
        this.open = true
    },
    closeWindow() {
        this.window.classList.remove('active')
        this.open = false
        this.chosenUsers = []
    },
    saveRoom() {
        if ((this.nameInput.value)) {
            REQUESTS.requestNewRoom(this.nameInput.value, this.chosenUsers)
        }
    },
    showUsers() {
        this.users.replaceChildren()
        for (const user in DATA.allUsers) {
            const userData = DATA.allUsers[user]
            if ((DATA.allUsers[user].id !== DATA.userData.id)) {
                console.log(userData)
                this.createUserDiv(userData)
            }
        }
    },
    createUserDiv(user) {
        let div = document.createElement("div");
        div.className = "user"
        div.id = "user_" + user.id
        const Name = user.username
        div.innerHTML = "<div class=\"user\">" + Name + "<button style='height: 20px;width: 50px'>Add</button>" + "<span style='display: none' id='notchosen'></span>" + "</div>"
        const button = div.getElementsByTagName("button")
        button.item(0).onclick = function () {
            const span = div.getElementsByTagName("span").item(0)
            if (span.id === 'notchosen') {
                const button = div.getElementsByTagName("button").item(0)
                button.innerHTML = 'Remove'
                span.id = "chosen"
                newRoomWindow.chosenUsers.push(user)
                console.log(newRoomWindow.chosenUsers)
            } else if (span.id === "chosen") {
                const button = div.getElementsByTagName("button").item(0)
                button.innerHTML = 'Add'
                span.id = "notchosen"
                newRoomWindow.chosenUsers = newRoomWindow.chosenUsers.filter((u) => u !== user)
                console.log(newRoomWindow.chosenUsers)
            }

        }
        this.users.appendChild(div);
    },
}