const baseURL = window.location.protocol + "//" + window.location.host + "/"
console.log(baseURL)
const bodyElement = document.getElementsByTagName('body')[0]
const roomsDiv = document.getElementById('rooms')
const messageDiv = document.getElementById('messages')
const groupNameElement = document.getElementById('groupDataDisplay')

const groupDataDisplay = document.getElementById('groupDataDisplay')
const overlay = document.getElementById('overlay')

const DATA = {
    userData: {
        id: null,
        username: "",
    },
    currentRoom: {
        id: null,
        name: '',
        ownerId: null,
        admins: [],
        rules: {},
        users: [],
        messages: [],
        text: {},
        files: [],
    },
    rooms: [],
    allUsers: [],
    userIsAdmin(userId) {
        return (DATA.currentRoom.admins.find((user) => user.id === userId) !== undefined)
    },
    userIsOwner(userId) {
        return (DATA.currentRoom.ownerId === userId)
    },
    clearCurrentRoomData() {
        this.currentRoom = {
            id: null,
            name: '',
            ownerId: null,
            admins: [],
            rules: {},
            users: [],
            messages: [],
            text: {},
            files: [],
        }
    },
}

const Data = {
    user: {id: null, name: "",},
    users: {/**
         <userId>:{name:<userName>}
         */
    },
    currentRoomId: null,
    rooms: {/**
         <roomId>:{
         insertMessage(messageData){},
         element: document.getElementById("room_"+<room_id>),
         messagesRequestCount: 0 # it ++'s with every new REQUESTS.requestRoomMessages(),
         requestMessages(){},
         scrollPosition: <scrollPos>,
         name: <roomName>,
         rules: <roomRules>,
         users: {
         <userId>:{name:<userName>}
         },
         owner: {id:<ownerId>,name:<ownerName>},
         admins: {
         <adminId>:{name:<adminName>}
         },
         messages: {
         <message_id>:{
         element: document.getElementById("message_"+<message_id>)
         text: <message_text>,
         authorId: <author_id>,
         media: {
         <media_id>:{
         messageId: <message_id>,
         file: <file>,
         },
         },
         setNewValues(text=this.text,authorId=this.authorId,media=this.media){
         this.text=text
         this.authorId=authorId
         this.media=media
         },
         },
         },
         }

         */
    },

    getCurrentRoom() {
        return this.rooms[this.currentRoomId]
    },
    createRoomDiv(roomData) {
        let div = document.createElement("div");
        div.className = "room"
        div.onclick = function () {
            chooseRoom(room.id)
        }
        div.id = "room_" + room.id
        div.innerHTML = 'Room ' + room.id + ' ' + room.name;
        roomsDiv.appendChild(div);
    },
    deleteRoomDiv(roomId) {
        this.rooms[roomId].element.remove()
    },
    deleteRoom(roomId) {
        this.deleteRoomDiv(roomId)
        for (const messageId in this.rooms[roomId].messages){
            this.rooms[roomId].deleteMessage(messageId)
        }
        if (this.currentRoomId === roomId) {
            this.currentRoomId = null
        }
        delete this.rooms[roomId]
    },
    addRoom(roomId) {
        this.rooms[roomId] = {
            element: document.getElementById("room_" + roomId),
            name: "",
            rules: "",
            owner: {},
            admins: {},
            users: {},
            messages: {},
            messagesRequestsCount: 0,
            scrollPosition: null,


            reloadMessageDiv(messageData) {
                const div = document.getElementById("message_" + messageData["messageId"])
                const timestamp = messageData["timestamp"]
                console.log("timestamp", timestamp)
                const author = DATA.allUsers.find((user) => user.id === messageData.authorId)
                div.innerHTML = "<div class=\"message-author\">" + author.name +
                    "</div><div class=\"message-body\">" + messageData.text + "</div>"
                for (const file in messageData["media"]) {
                    const fileData = messageData["media"][file]
                    console.log(fileData)
                    const format = fileData['file'].split('.').pop()
                    console.log("format ", format)
                    const mediaHref = "http://" + window.location.host + "/media/" + fileData['file']
                    if (["mp4", "webm"].find(value => value === format)) {
                        div.innerHTML += "<div>" + "<video style='max-width: 400px' src=\'" + mediaHref + "\' controls/>" + "</div>"
                    } else if (["jpg", "jpeg", "png", "gif"].find(value => value === format)) {
                        div.innerHTML += "<div>" + "<img style='max-width: 400px' src=\'" + mediaHref + "\' alt=''/>" + "</div>"
                    } else if (["waw", "mp3"].find(value => value === format)) {
                        div.innerHTML += "<div>" + "<audio style='' src=\'" + mediaHref + "\' controls/>" + "</div>"
                    } else {
                        div.innerHTML +=
                            "<div style='min-height: 40px; margin: 5px 0;' class=\'flex-r a-c\'>"
                            + "<a style='max-width: 400px;' href=\'" + mediaHref + "\'> File: " + fileData["file_name"] + "</a>"
                            + "</div>"
                    }
                }
            },
            createMessageDiv(messageData) {
                const div = document.createElement("div");
                div.className = "message"
                const timestamp = messageData["timestamp"]
                console.log("timestamp", timestamp)
                div.id = "message_" + id
                const author = DATA.allUsers.find((user) => user.id === messageData.authorId)
                div.innerHTML = "<div class=\"message-author\">" + author.name +
                    "</div><div class=\"message-body\">" + messageData.text + "</div>"
                for (const file in messageData["media"]) {
                    const fileData = messageData["media"][file]
                    console.log(fileData)
                    const format = fileData['file'].split('.').pop()
                    console.log("format ", format)
                    const mediaHref = "http://" + window.location.host + "/media/" + fileData['file']
                    if (["mp4", "webm"].find(value => value === format)) {
                        div.innerHTML += "<div>" + "<video style='max-width: 400px' src=\'" + mediaHref + "\' controls/>" + "</div>"
                    } else if (["jpg", "jpeg", "png", "gif"].find(value => value === format)) {
                        div.innerHTML += "<div>" + "<img style='max-width: 400px' src=\'" + mediaHref + "\' alt=''/>" + "</div>"
                    } else if (["waw", "mp3"].find(value => value === format)) {
                        div.innerHTML += "<div>" + "<audio style='' src=\'" + mediaHref + "\' controls/>" + "</div>"
                    } else {
                        div.innerHTML +=
                            "<div style='min-height: 40px; margin: 5px 0;' class=\'flex-r a-c\'>"
                            + "<a style='max-width: 400px;' href=\'" + mediaHref + "\'> File: " + fileData["file_name"] + "</a>"
                            + "</div>"
                    }
                }
                messageDiv.appendChild(div);
            },
            deleteMessageDiv(messageId) {
                const div = document.getElementById("message_" + messageId)
                div.remove()
            },
            insertMessage(messageData) {
                const messageId = messageData["messageId"]
                if (this.messages[messageId]) {
                    this.messages[messageId].setMessageData(messageData)
                } else {
                    this.createMessageDiv(messageData)
                    this.messages[messageId] = {
                        element: document.getElementById("message_" + messageId),
                        text: messageData["text"],
                        authorId: messageData["authorId"],
                        media: messageData["media"],
                        roomId: roomId,
                        timestamp: messageData["timestamp"],
                        setMessageData(messageData) {
                            this.text = messageData["text"]
                            this.authorId = messageData["authorId"]
                            this.media = messageData["media"]
                            this.timestamp = messageData["timestamp"]
                            Data.rooms[roomId].reloadMessageDiv(messageData)
                            // this.roomId
                        },
                    }
                }
                console.log("Room_" + roomId + " message_" + messageId, this.messages[messageId])
            },
            deleteMessage(messageId) {
                console.log("deleted message_" + messageId, this.messages)
                this.deleteMessageDiv(messageId)
                delete this.messages[messageId]

            },
            isAdmin() {
                console.log("is Admin", Data.user.id in this.admins)
                return Data.user.id in this.admins
            },
            isOwner() {
                console.log("is Owner", Data.user.id === this.owner.id)
                return Data.user.id === this.owner.id
            },
        }
    },

}
const messagesWindow = {
    window: document.getElementById("messages"),
    displayMessages(messages) {
        for (const id in messages) {
            this.createMessageDiv(id, messages[id])
        }
    },
    createMessageDiv(id, message) {
        const div = document.createElement("div");
        div.className = "message"
        div.id = "message_" + id
        const author = DATA.allUsers.find((user) => user.id === message.authorId)
        div.innerHTML = "<div class=\"message-author\">" + author.name +
            "</div><div class=\"message-body\">" + message.message + "</div>"
        for (const file in message["media"]) {
            const fileData = message["media"][file]
            console.log(fileData)
            const format = fileData['file'].split('.').pop()
            console.log("format ", format)
            const mediaHref = "http://" + window.location.host + "/media/" + fileData['file']
            if (["mp4", "webm"].find(value => value === format)) {
                div.innerHTML += "<div>" + "<video style='max-width: 400px' src=\'" + mediaHref + "\' controls/>" + "</div>"
            } else if (["jpg", "jpeg", "png", "gif"].find(value => value === format)) {
                div.innerHTML += "<div>" + "<img style='max-width: 400px' src=\'" + mediaHref + "\' alt=''/>" + "</div>"
            } else if (["waw", "mp3"].find(value => value === format)) {
                div.innerHTML += "<div>" + "<audio style='' src=\'" + mediaHref + "\' controls/>" + "</div>"
            } else {
                div.innerHTML +=
                    "<div style='min-height: 40px; margin: 5px 0;' class=\'flex-r a-c\'>"
                    + "<a style='max-width: 400px;' href=\'" + mediaHref + "\'> File: " + fileData["file_name"] + "</a>"
                    + "</div>"
            }
        }
        this.window.appendChild(div);

    },

}

const INPUT = {
    textInputElement: document.getElementById('input'),
    /**
     * roomId: {
     *     text: string of input
     *     files: [] of files
     * }
     */
    getFiles(roomId) {
        if (INPUT[roomId]) {
            return this[roomId]["files"]
        }
    },
    clearFileInput(roomId) {
        this[roomId]["files"] = []
        fileInputWindow.showFiles()
    },
    clearTextInput(roomId) {
        this[roomId]["text"] = ""
    },
}
INPUT.textInputElement.addEventListener('keydown', function (e) {
    const keyCode = e.which || e.keyCode;
    if (DATA.currentRoom.id !== null) {
        if (INPUT[DATA.currentRoom.id]) {
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
        sendMessage()
        INPUT.textInputElement.value = ""
    }
});
messageDiv.addEventListener("scroll", getScrollPosition)

function getScrollPosition() {
    let y = messageDiv.scrollTop;
    console.log(y); // scroll position from top
}

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
            room_id: DATA.currentRoom.id,
            request: "send_message",
            has_media: INPUT.getFiles(DATA.currentRoom.id).length > 0,
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
        websocket.send(JSON.stringify({
            request: 'group_data',
            room_id: DATA.currentRoom.id
        }))
    },
    requestRoomMessages() {
        console.log('from-user', {
            request: 'room_messages',
            room_id: DATA.currentRoom.id
        })
        websocket.send(JSON.stringify({
            request: 'room_messages',
            room_id: DATA.currentRoom.id
        }))
    },
    requestSaveRoomRules() {
        console.log("from-user", {
            request: "save_rules",
            room_id: DATA.currentRoom.id,
            rules: DATA.currentRoom.rules,
        })
        websocket.send(JSON.stringify({
            request: "save_rules",
            room_id: DATA.currentRoom.id,
            rules: DATA.currentRoom.rules,
        }))
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
    requestRemoveAdmin(userId, roomId) {
        console.log("from-user", {
            request: "remove_admin",
            user_id: userId,
            room_id: roomId,
        })
        websocket.send(JSON.stringify(
            {
                request: "remove_admin",
                user_id: userId,
                room_id: roomId,
            }
        ))
    },
    requestMakeAdmin(userId, roomId) {
        console.log("from-user", {
            request: "make_admin",
            user_id: userId,
            room_id: roomId,
        })
        websocket.send(JSON.stringify(
            {
                request: "make_admin",
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
    if (data["rooms"]) {
        DATA.rooms = data['rooms']
        if (!(DATA.rooms.find((room) => room.id === DATA.currentRoom.id))) {
            DATA.clearCurrentRoomData()
            showMessages()
        }
        showRooms()
        showRoomName()
    }
    if (data["ownerId"]) {
        DATA.currentRoom["ownerId"] = data["ownerId"]
    }
    if (data["admins"]) {
        DATA.currentRoom["admins"] = data["admins"]
        if (setRulesWindow.open) {
            setRulesWindow.showUsers()
        }
    }
    if (data["roomRules"]) {
        if (data["roomRules"] !== "none") {
            DATA.currentRoom.rules = JSON.parse(data["roomRules"])
        } else {
            DATA.currentRoom.rules.ruleUserCanPost = true
            DATA.currentRoom.rules.ruleUserCanRenameRoom = true
            DATA.currentRoom.rules.ruleUserCanInvite = true
            DATA.currentRoom.rules.ruleUserCanKick = false
            DATA.currentRoom.rules.ruleAdminCanAddAdmins = true
            DATA.currentRoom.rules.ruleAdminCanRemoveAdmins = false
            DATA.currentRoom.rules.ruleAdminCanRenameRoom = true
        }
        if (!DATA.userIsOwner(DATA.userData.id)) {
            if ((!DATA.currentRoom.rules.ruleUserCanPost) && (DATA.currentRoom.rules !== "none") && (!DATA.userIsAdmin(DATA.userData.id))) {
                console.log("input disabled")
                INPUT.textInputElement.setAttribute("disabled", "true")
                INPUT.textInputElement.setAttribute("placeholder", "you cannot send messages")
            } else {
                console.log("input activated")
                INPUT.textInputElement.removeAttribute("disabled")
                INPUT.textInputElement.setAttribute("placeholder", "")
            }
            if ((!DATA.currentRoom.rules.ruleUserCanRenameRoom) && (DATA.currentRoom.rules !== "none") && (!DATA.userIsAdmin(DATA.userData.id))) {
                console.log("rename disabled")
                RoomRenameWindow.groupWindowButton.style.display = "none"
            } else if ((DATA.userIsAdmin(DATA.userData.id)) && (!DATA.currentRoom.rules.ruleAdminCanRenameRoom)) {
                console.log("rename disabled")
                RoomRenameWindow.groupWindowButton.style.display = "none"
            } else {
                RoomRenameWindow.groupWindowButton.style.display = "inherit"
            }
            if ((!DATA.currentRoom.rules.ruleUserCanInvite) && (DATA.currentRoom.rules !== "none") && (!DATA.userIsAdmin(DATA.userData.id))) {
                console.log("invite disabled")
                inviteUsersWindow.groupWindowButton.style.display = "none"
            } else {
                inviteUsersWindow.groupWindowButton.style.display = "inherit"
            }
            if ((!DATA.currentRoom.rules.ruleUserCanKick) && (DATA.currentRoom.rules !== "none") && (!DATA.userIsAdmin(DATA.userData.id))) {
                console.log("kick disabled")
                kickUserWindow.groupWindowButton.style.display = "none"
            } else {
                kickUserWindow.groupWindowButton.style.display = "inherit"
            }
            if (!DATA.userIsAdmin(DATA.userData.id)) {
                setRulesWindow.groupWindowButton.style.display = "none"
            } else {
                setRulesWindow.groupWindowButton.style.display = "inherit"
            }
        } else {
            console.log("input activated")
            INPUT.textInputElement.removeAttribute("disabled")
            INPUT.textInputElement.setAttribute("placeholder", "")
            RoomRenameWindow.groupWindowButton.style.display = "inherit"
            inviteUsersWindow.groupWindowButton.style.display = "inherit"
            kickUserWindow.groupWindowButton.style.display = "inherit"
            setRulesWindow.groupWindowButton.style.display = "inherit"
        }
    }
    if (data["users"]) {
        DATA.currentRoom["users"] = data['users']
        if (inviteUsersWindow.open) {
            inviteUsersWindow.showUsersToInvite()
        }
        if (kickUserWindow.open) {
            kickUserWindow.showUsersToKick()
        }
    }
    if (data["messages"]) {
        DATA.currentRoom["messages"] = data['messages']
        showMessages()
    }
    if (data["user"]) {
        DATA.userData = data['user']
    }
    if (data["yourMessage"]) {
        if (INPUT[DATA.currentRoom.id]["files"].length !== 0) {
            const messageId = data["yourMessage"].id
            for (const file in INPUT[DATA.currentRoom.id]["files"]) {
                console.log("file ", INPUT[DATA.currentRoom.id]["files"][file])
                uploadFile(INPUT[DATA.currentRoom.id]["files"][file], messageId)
            }
            INPUT.clearFileInput(DATA.currentRoom.id)
        }
    }
    if (data["newMessage"]) {
        if (data["newMessage"]["room_id_id"] === DATA.currentRoom.id) {
            DATA.currentRoom.messages.push(data['newMessage'])
            showMessages()
        }
    }
    if (data["updateMessage"]) {
        const message_data = data["updateMessage"]
        createMessageDiv(message_data)
    }
    if (data["allUsers"]) {
        DATA.allUsers = data['allUsers']
    }
    if (data["reload"]) {
        reload(data["reload"])
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
    let div = document.getElementById("message_" + message.id)
    let isNew = false
    if (div === null) {
        isNew = true
        div = document.createElement("div");
    }
    div.className = "message"
    div.id = "message_" + message.id
    const Author = DATA.allUsers.find((user) => user.id === message.author_id_id)
    div.innerHTML = "<div class=\"message-author\">" + Author.username +
        "</div><div class=\"message-body\">" + message.message + "</div>"
    for (const file in message["media"]) {
        const fileData = message["media"][file]
        console.log(fileData)
        const format = fileData['file'].split('.').pop()
        console.log("format ", format)
        const mediaHref = "http://" + window.location.host + "/media/" + fileData['file']
        if (["mp4", "webm"].find(value => value === format)) {
            div.innerHTML += "<div>" + "<video style='max-width: 400px' src=\'" + mediaHref + "\' controls/>" + "</div>"
        } else if (["jpg", "jpeg", "png", "gif"].find(value => value === format)) {
            div.innerHTML += "<div>" + "<img style='max-width: 400px' src=\'" + mediaHref + "\' alt=''/>" + "</div>"
        } else if (["waw", "mp3"].find(value => value === format)) {
            div.innerHTML += "<div>" + "<audio style='' src=\'" + mediaHref + "\' controls/>" + "</div>"
        } else {
            div.innerHTML +=
                "<div style='min-height: 40px; margin: 5px 0;' class=\'flex-r a-c\'>"
                + "<a style='max-width: 400px;' href=\'" + mediaHref + "\'> File: " + fileData["file_name"] + "</a>"
                + "</div>"
        }
    }
    if (isNew) {
        messageDiv.appendChild(div);
    }
}

function chooseRoom(id) {
    if (DATA.currentRoom.id !== id) {
        DATA.currentRoom.id = id
        if (INPUT[DATA.currentRoom.id]) {
            INPUT.textInputElement.value = INPUT[DATA.currentRoom.id]['text']
        } else {
            INPUT.textInputElement.value = ""
        }
        REQUESTS.requestRoomData()
        REQUESTS.requestRoomMessages()
        showRoomName()
        fileInputWindow.openWindow()
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
    setRulesWindow.closeWindow()
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
    setRules() {
        REQUESTS.requestRoomData()
        this.closeWindow()
        setRulesWindow.openWindow()
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
    groupWindowButton: document.getElementById("groupRename"),
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

const setRulesWindow = {
    open: false,
    window: document.getElementById("setRulesWindow"),
    groupWindowButton: document.getElementById("groupRules"),
    header: document.getElementById("setRulesWindowHeader"),
    rules: {
        ruleUserCanPost: {
            element: document.getElementById("ruleUserCanPost"),
            value: true,
        },
        ruleUserCanRenameRoom: {
            element: document.getElementById("ruleUserCanRenameRoom"),
            value: true,
        },
        ruleUserCanInvite: {
            element: document.getElementById("ruleUserCanInvite"),
            value: true,
        },
        ruleUserCanKick: {
            element: document.getElementById("ruleUserCanKick"),
            value: false,
        },
        ruleAdminCanRenameRoom: {
            element: document.getElementById("ruleAdminCanRenameRoom"),
            value: true,
        },
        ruleAdminCanAddAdmins: {
            element: document.getElementById("ruleAdminCanAddAdmins"),
            value: true,
        },
        ruleAdminCanRemoveAdmins: {
            element: document.getElementById("ruleAdminCanRemoveAdmins"),
            value: false,
        },
    },
    usersListDisplay: document.getElementById("setRulesWindowAdmins"),
    setRulesWindowListAdmin: document.getElementById("setRulesWindowListAdmin"),

    openWindow() {
        this.open = true
        this.showRules()
        if (!DATA.userIsOwner(DATA.userData.id)) {
            this.setRulesWindowListAdmin.style.display = "none"
        } else {
            this.setRulesWindowListAdmin.style.display = "inherit"
        }
        this.window.classList.add("active")
        this.header.innerHTML = "<button style='margin-left: 10px'>&larr;</button>" + "<span style='margin-left: 70px'>" + 'Rules ' + DATA.currentRoom.name + "</span>"
        const button = this.header.getElementsByTagName('button')
        button.item(0).onclick = function () {
            setRulesWindow.closeWindow()
            GroupMenuWindow.openWindow()
        }
    },
    showRules() {
        console.log("Rules", DATA.currentRoom.rules)
        if ((DATA.currentRoom.rules !== "none") && (DATA.currentRoom.rules !== undefined)) {

            this.rules.ruleUserCanPost.value = DATA.currentRoom.rules.ruleUserCanPost
            this.rules.ruleUserCanRenameRoom.value = DATA.currentRoom.rules.ruleUserCanRenameRoom
            this.rules.ruleUserCanInvite.value = DATA.currentRoom.rules.ruleUserCanInvite
            this.rules.ruleUserCanKick.value = DATA.currentRoom.rules.ruleUserCanKick
            this.rules.ruleAdminCanAddAdmins.value = DATA.currentRoom.rules.ruleAdminCanAddAdmins
            this.rules.ruleAdminCanRemoveAdmins.value = DATA.currentRoom.rules.ruleAdminCanRemoveAdmins
            this.rules.ruleAdminCanRenameRoom.value = DATA.currentRoom.rules.ruleAdminCanRenameRoom

            this.rules.ruleUserCanPost.element.checked = this.rules.ruleUserCanPost.value
            this.rules.ruleUserCanRenameRoom.element.checked = this.rules.ruleUserCanRenameRoom.value
            this.rules.ruleUserCanInvite.element.checked = this.rules.ruleUserCanInvite.value
            this.rules.ruleUserCanKick.element.checked = this.rules.ruleUserCanKick.value
            this.rules.ruleAdminCanAddAdmins.element.checked = this.rules.ruleAdminCanAddAdmins.value
            this.rules.ruleAdminCanRemoveAdmins.element.checked = this.rules.ruleAdminCanRemoveAdmins.value
            this.rules.ruleAdminCanRenameRoom.element.checked = this.rules.ruleAdminCanRenameRoom.value

        } else {
            this.rules.ruleUserCanPost.value = true
            this.rules.ruleUserCanRenameRoom.value = true
            this.rules.ruleUserCanInvite.value = true
            this.rules.ruleUserCanKick.value = false
            this.rules.ruleAdminCanAddAdmins.value = true
            this.rules.ruleAdminCanRemoveAdmins.value = false
            this.rules.ruleAdminCanRenameRoom.value = true


            this.rules.ruleUserCanPost.element.checked = this.rules.ruleUserCanPost.value
            this.rules.ruleUserCanRenameRoom.element.checked = this.rules.ruleUserCanRenameRoom.value
            this.rules.ruleUserCanInvite.element.checked = this.rules.ruleUserCanInvite.value
            this.rules.ruleUserCanKick.element.checked = this.rules.ruleUserCanKick.value
            this.rules.ruleAdminCanAddAdmins.element.checked = this.rules.ruleAdminCanAddAdmins.value
            this.rules.ruleAdminCanRemoveAdmins.element.checked = this.rules.ruleAdminCanRemoveAdmins.value
            this.rules.ruleAdminCanRenameRoom.element.checked = this.rules.ruleAdminCanRenameRoom.value
        }
        DATA.currentRoom.rules = {
            ruleUserCanPost: this.rules.ruleUserCanPost.value,
            ruleUserCanRenameRoom: this.rules.ruleUserCanRenameRoom.value,
            ruleUserCanInvite: this.rules.ruleUserCanInvite.value,
            ruleUserCanKick: this.rules.ruleUserCanKick.value,
            ruleAdminCanAddAdmins: this.rules.ruleAdminCanAddAdmins.value,
            ruleAdminCanRemoveAdmins: this.rules.ruleAdminCanRemoveAdmins.value,
            ruleAdminCanRenameRoom: this.rules.ruleAdminCanRenameRoom.value
        }
        this.showUsers()
    },
    showUsers() {
        this.usersListDisplay.replaceChildren()
        for (const user in DATA.currentRoom.users) {
            const userData = DATA.currentRoom.users[user]

            console.log(userData)
            this.createUserDiv(userData)

        }
    },
    createUserDiv(userData) {
        let div = document.createElement("div");
        div.className = "user"
        div.id = "user_" + userData.id
        const Name = userData.username
        if (DATA.userIsOwner(DATA.userData.id)) {
            console.log("You are an owner")
            if (DATA.userIsOwner(userData.id)) {
                div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "Owner" + "</div>"
            } else if (DATA.userIsAdmin(userData.id)) {
                div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "<button>remove admin</button>" + "</div>"
                const button = div.getElementsByTagName("button")
                button.item(0).onclick = function () {
                    REQUESTS.requestRemoveAdmin(userData.id, DATA.currentRoom.id)
                }
            } else {
                div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "<button>make admin</button>" + "</div>"
                const button = div.getElementsByTagName("button")
                button.item(0).onclick = function () {
                    REQUESTS.requestMakeAdmin(userData.id, DATA.currentRoom.id)
                }
            }
        } else if (DATA.userIsAdmin(DATA.userData.id)) {
            console.log("You are an admin")
            if (DATA.userIsOwner(userData.id)) {
                div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "Owner" + "</div>"
            } else if (DATA.userIsAdmin(userData.id)) {
                if (DATA.currentRoom.rules.ruleAdminCanRemoveAdmins) {
                    div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "<button>remove admin</button>" + "</div>"
                    const button = div.getElementsByTagName("button")
                    button.item(0).onclick = function () {
                        REQUESTS.requestRemoveAdmin(userData.id, DATA.currentRoom.id)
                    }
                } else {
                    div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "Admin" + "</div>"
                }
            } else {
                if (DATA.currentRoom.rules.ruleAdminCanAddAdmins) {
                    div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "<button>make admin</button>" + "</div>"
                    const button = div.getElementsByTagName("button")
                    button.item(0).onclick = function () {
                        REQUESTS.requestMakeAdmin(userData.id, DATA.currentRoom.id)
                    }
                } else {
                    div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "User" + "</div>"
                }
            }
        } else {
            console.log("You are a user")
            if (DATA.userIsOwner(userData.id)) {
                div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "Owner" + "</div>"
            } else if (DATA.userIsAdmin(userData.id)) {
                div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "Admin" + "</div>"
            } else {
                div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "User" + "</div>"
            }
        }
        this.usersListDisplay.appendChild(div);
    },
    saveRules() {
        this.rules.ruleUserCanPost.value = this.rules.ruleUserCanPost.element.checked
        this.rules.ruleUserCanRenameRoom.value = this.rules.ruleUserCanRenameRoom.element.checked
        this.rules.ruleUserCanInvite.value = this.rules.ruleUserCanInvite.element.checked
        this.rules.ruleUserCanKick.value = this.rules.ruleUserCanKick.element.checked
        this.rules.ruleAdminCanAddAdmins.value = this.rules.ruleAdminCanAddAdmins.element.checked
        this.rules.ruleAdminCanRemoveAdmins.value = this.rules.ruleAdminCanRemoveAdmins.element.checked
        this.rules.ruleAdminCanRenameRoom.value = this.rules.ruleAdminCanRenameRoom.element.checked

        DATA.currentRoom.rules = {
            ruleUserCanPost: this.rules.ruleUserCanPost.value,
            ruleUserCanRenameRoom: this.rules.ruleUserCanRenameRoom.value,
            ruleUserCanInvite: this.rules.ruleUserCanInvite.value,
            ruleUserCanKick: this.rules.ruleUserCanKick.value,
            ruleAdminCanAddAdmins: this.rules.ruleAdminCanAddAdmins.value,
            ruleAdminCanRemoveAdmins: this.rules.ruleAdminCanRemoveAdmins.value,
            ruleAdminCanRenameRoom: this.rules.ruleAdminCanRenameRoom.value,
        }
        console.log(DATA.currentRoom.rules)
        REQUESTS.requestSaveRoomRules()
    },
    closeWindow() {
        this.window.classList.remove("active")
        this.open = false
    },
}

const inviteUsersWindow = {
    open: false,
    window: document.getElementById("inviteUsersToRoom"),
    groupWindowButton: document.getElementById("groupInvite"),
    inviteToRoomName: document.getElementById("inviteToRoomName"),
    inviteUsersDiv: document.getElementById("inviteUsersDiv"),
    openWindow() {
        this.inviteToRoomName.innerHTML = "<button style='margin-left: 10px'>&larr;</button>" + "<span style='margin-left: 70px'>" + "Invite to " + DATA.currentRoom.name + "</span>"
        const button = this.inviteToRoomName.getElementsByTagName('button')
        button.item(0).onclick = function () {
            inviteUsersWindow.closeWindow()
            GroupMenuWindow.openWindow()
        }
        this.window.classList.add("active")
        this.showUsersToInvite()
        overlay.classList.add("active")
        this.open = true
    },
    closeWindow() {
        this.window.classList.remove('active')
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
    window: document.getElementById("kickWindow"),
    groupWindowButton: document.getElementById("groupKick"),
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
        this.window.classList.add("active")
        this.showUsersToKick()
        overlay.classList.add("active")
        this.open = true
    },
    closeWindow() {
        this.window.classList.remove('active')
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