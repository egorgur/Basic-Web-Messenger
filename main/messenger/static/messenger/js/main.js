const baseURL = window.location.protocol + "//" + window.location.host + "/"
console.log(baseURL)
const bodyElement = document.getElementsByTagName('body')[0]
const roomsDiv = document.getElementById('rooms')
const messageDiv = document.getElementById('messages')
const groupNameElement = document.getElementById('groupDataDisplay')

const groupDataDisplay = document.getElementById('groupDataDisplay')
const overlay = document.getElementById('overlay')


const Data = {
    user: {id: null, name: "",},
    allUsers: {/**
         <userId>:{name:<userName>}
         */
    },
    currentRoomId: null,
    rooms: {},

    getCurrentRoom() {
        return this.rooms[this.currentRoomId]
    },
    chooseRoom(id) {
        if (this.currentRoomId !== null) {
            this.getCurrentRoom().hideMessages()
        }
        this.currentRoomId = id
        if (INPUT[Data.currentRoomId]) {
            INPUT.textInputElement.value = INPUT[Data.currentRoomId]['text']
        } else {
            INPUT.textInputElement.value = ""
        }
        console.log(Data.getCurrentRoom().messagesRequestsCount)
        REQUESTS.requestRoomData()
        if (Data.getCurrentRoom().messagesRequestsCount === 0) {
            console.log("requested messages first time")
            REQUESTS.requestRoomMessages(Data.getCurrentRoom().messagesRequestsCount)
            Data.getCurrentRoom().messagesRequestsCount++
        } else {
            Data.getCurrentRoom().showMessages()
        }
        fileInputWindow.openWindow()
        showRoomName()
    },
    createRoomDiv(roomData) {
        let div = document.createElement("div");
        div.className = "room"
        div.onclick = function () {
            Data.chooseRoom(roomData.id)
        }
        div.id = "room_" + roomData.id
        div.innerHTML = 'Room ' + roomData.id + ' ' + roomData.name;
        roomsDiv.appendChild(div);
    },
    deleteRoomDiv(roomId) {
        this.rooms[roomId].element.remove()
    },
    deleteRoom(roomId) {
        this.deleteRoomDiv(roomId)
        for (const messageId in this.rooms[roomId].messages) {
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
            ownerId: null,
            admins: {},
            users: {},
            messages: {},
            messagesRequestsCount: 0,
            scrollPosition: null,


            reloadMessageDiv(messageData) {
                const div = document.getElementById("message_" + messageData["messageId"])
                const timestamp = messageData["timestamp"]
                console.log("timestamp", timestamp)
                const author = Data.allUsers[messageData.authorId]
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
                // console.log("messageData", messageData)
                const div = document.createElement("div");
                div.className = "message"
                div.style.order = messageData["order"]
                const timestamp = messageData["timestamp"]
                div.id = "message_" + messageData["messageId"]
                const author = Data.allUsers[messageData.authorId]
                div.innerHTML = "<div class=\"message-author\">" + author.username +
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

                messageDiv.appendChild(div)
            },
            deleteMessageDiv(messageId) {
                this.messages[messageId].hide()
            },
            calculateOrder() {
                let messageObjects = []
                for (const messageId in this.messages) {
                    messageObjects.push({
                        messageId: messageId, timestamp: this.messages[messageId].timestamp
                    })
                }
                messageObjects.sort((a, b) => {
                    if (a.timestamp < b.timestamp) {
                        return -1
                    }
                    if (a.timestamp > b.timestamp) {
                        return 1
                    }
                    return 0
                })
                // console.log("sortedMessageObjects",messageObjects)
                for (const key in messageObjects) {
                    this.messages[messageObjects[key]["messageId"]].order = -key
                }
            },
            insertMessage(messageData) {
                messageData = wierdMessageDataParser(messageData)
                const messageId = messageData["messageId"]
                if (this.messages[messageId]) {
                    this.messages[messageId].setMessageData(messageData)
                } else {
                    this.messages[messageId] = {
                        element: null,
                        order: null,
                        messageId: messageData["messageId"],
                        text: messageData["text"],
                        authorId: messageData["authorId"],
                        hasMedia: messageData["hasMedia"],
                        media: messageData["media"],
                        roomId: roomId,
                        timestamp: parseInt(messageData["timestamp"]),
                        setMessageData(messageData) {
                            this.text = messageData["text"]
                            this.authorId = messageData["authorId"]
                            this.hasMedia = messageData["hasMedia"]
                            this.timestamp = messageData["timestamp"]
                            if (this.element !== null) {
                                Data.rooms[roomId].reloadMessageDiv(messageData)
                            }
                        },
                        show() {
                            Data.rooms[roomId].calculateOrder()
                            console.log("messageShow", this.messageId, this)
                            if (this.element === null) {
                                messageData["order"] = this.order
                                Data.rooms[roomId].createMessageDiv(messageData)
                                this.element = document.getElementById("message_" + this.messageId)
                            }
                        },
                        hide() {
                            if (this.element !== null) {
                                this.element.remove()
                                this.element = null
                            }
                        },
                    }
                }
                // console.log("Room_" + roomId + " message_" + messageId, this.messages[messageId])
            },
            deleteMessage(messageId) {
                console.log("deleted message_" + messageId, this.messages)
                this.deleteMessageDiv(messageId)
                delete this.messages[messageId]
            },
            showMessages() {
                Object.keys(this.messages).reverse().forEach((messageId) => {
                    this.messages[parseInt(messageId)].show()
                })
                messageDiv.scrollTop = messageDiv.scrollHeight;
            },
            hideMessages() {
                Object.keys(this.messages).reverse().forEach((messageId) => {
                    console.log("messageHide", messageId, this.messages[parseInt(messageId)])
                    this.messages[parseInt(messageId)].hide()
                })
            },
            isAdmin() {
                console.log("is Admin", Data.user.id in this.admins)
                return Data.user.id in this.admins
            },
            isOwner() {
                console.log("is Owner", Data.user.id === this.ownerId)
                return Data.user.id === this.ownerId
            },
        }
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
    if (Data.currentRoomId !== null) {
        if (INPUT[Data.currentRoomId]) {
            INPUT[Data.currentRoomId]["text"] = INPUT.textInputElement.value
        } else {
            INPUT[Data.currentRoomId] = {
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
    let y = messageDiv.scrollTop
    let height = messageDiv.scrollHeight
    let test = messageDiv.clientHeight
    console.log("y", y, "height", height, "clHeight", test); // scroll position from top

}

function sendMessage() {
    if (Data.currentRoomId !== null) {
        websocket.send(JSON.stringify({
            message: INPUT.textInputElement.value,
            room_id: Data.currentRoomId,
            request: "send_message",
            has_media: INPUT.getFiles(Data.currentRoomId,).length > 0,
        }))
    }

}


const REQUESTS = {
    requestRooms() {
        console.log('from-user', {request: 'rooms'})
        websocket.send(JSON.stringify(
            {request: 'rooms'}
        ))
    },
    requestRoomData() {
        console.log('from-user', {
            request: 'group_data',
            room_id: Data.currentRoomId,
        })
        websocket.send(JSON.stringify({
            request: 'group_data',
            room_id: Data.currentRoomId,
        }))
    },
    requestRoomMessages(messagesRequestCount) {
        console.log('from-user', {
            messages_request_count: messagesRequestCount,
            request: 'room_messages',
            room_id: Data.currentRoomId,
        })
        websocket.send(JSON.stringify({
            messages_request_count: messagesRequestCount,
            request: 'room_messages',
            room_id: Data.currentRoomId,
        }))

    },
    requestSaveRoomRules() {
        console.log("from-user", {
            request: "save_rules",
            room_id: Data.currentRoomId,
            rules: Data.getCurrentRoom().rules,
        })
        websocket.send(JSON.stringify({
            request: "save_rules",
            room_id: Data.currentRoomId,
            rules: Data.getCurrentRoom().rules,
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
            user_id: Data.user.id,
            room_id: Data.currentRoomId,
        })
        websocket.send(JSON.stringify(
            {
                request: "leave",
                user_id: Data.user.id,
                room_id: Data.currentRoomId,
            }
        ))
    },
    requestDeleteRoom() {
        console.log('from-user', {
            request: "delete_room",
            room_id: Data.currentRoomId,
        })
        websocket.send(JSON.stringify(
            {
                request: "delete_room",
                room_id: Data.currentRoomId,
            }
        ))
    },
    requestNewRoom(name, users) {
        console.log('from-user', {
            request: "new_room",
            name: name,
            users: users,
        })
        websocket.send(JSON.stringify(
            {
                request: "new_room",
                name: name,
                creator: Data.user.id,
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

function websocketDataHandler(data) {
    console.log('from-server:', data)
    if (data["rooms"]) {
        for (const key in data["rooms"]) {
            const roomData = data["rooms"][key]
            Data.createRoomDiv(roomData)
            Data.addRoom(roomData["id"])
            Data.rooms[roomData["id"]].name = roomData["name"]
            Data.rooms[roomData["id"]].rules = roomData["rules"]
        }
    }
    if (data["allUsers"]) {
        for (const key in data["allUsers"]) {
            const userId = data["allUsers"][key]["id"]
            Data.allUsers[userId] = data["allUsers"][key]
        }
    }
    if (data["roomName"]) {
        if (data["roomId"]) {
            Data.rooms[data["roomId"]].name = data["roomName"]
        }
    }
    if (data["ownerId"]) {
        console.log(data["ownerId"])
        Data.getCurrentRoom().ownerId = data["ownerId"]
    }
    if (data["admins"]) {
        for (const key in data["admins"]) {
            const adminId = data["admins"][key]["id"]
            Data.getCurrentRoom().admins[adminId] = data["admins"][key]
        }
        if (setRulesWindow.open) {
            setRulesWindow.showUsers()
        }
    }
    if (data["roomRules"]) {
        if (data["roomRules"] !== "none") {
            Data.getCurrentRoom().rules = JSON.parse(data["roomRules"])
        } else {
            Data.getCurrentRoom().rules.ruleUserCanPost = true
            Data.getCurrentRoom().rules.ruleUserCanRenameRoom = true
            Data.getCurrentRoom().rules.ruleUserCanInvite = true
            Data.getCurrentRoom().rules.ruleUserCanKick = false
            Data.getCurrentRoom().rules.ruleAdminCanAddAdmins = true
            Data.getCurrentRoom().rules.ruleAdminCanRemoveAdmins = false
            Data.getCurrentRoom().rules.ruleAdminCanRenameRoom = true
        }
        if (!Data.getCurrentRoom().isOwner(Data.user.id)) {
            if ((!Data.getCurrentRoom().rules.ruleUserCanPost) && (Data.getCurrentRoom().rules !== "none") && (!Data.getCurrentRoom().isAdmin(Data.user.id))) {
                console.log("input disabled")
                INPUT.textInputElement.setAttribute("disabled", "true")
                INPUT.textInputElement.setAttribute("placeholder", "you cannot send messages")
            } else {
                console.log("input activated")
                INPUT.textInputElement.removeAttribute("disabled")
                INPUT.textInputElement.setAttribute("placeholder", "")
            }
            if ((!Data.getCurrentRoom().rules.ruleUserCanRenameRoom) && (Data.getCurrentRoom().rules !== "none") && (!Data.getCurrentRoom().isAdmin(Data.user.id))) {
                console.log("rename disabled")
                RoomRenameWindow.groupWindowButton.style.display = "none"
            } else if ((Data.getCurrentRoom().isAdmin(Data.user.id)) && (!Data.getCurrentRoom().rules.ruleAdminCanRenameRoom)) {
                console.log("rename disabled")
                RoomRenameWindow.groupWindowButton.style.display = "none"
            } else {
                RoomRenameWindow.groupWindowButton.style.display = "inherit"
            }
            if ((!Data.getCurrentRoom().rules.ruleUserCanInvite) && (Data.getCurrentRoom().rules !== "none") && (!Data.getCurrentRoom().isAdmin(Data.user.id))) {
                console.log("invite disabled")
                inviteUsersWindow.groupWindowButton.style.display = "none"
            } else {
                inviteUsersWindow.groupWindowButton.style.display = "inherit"
            }
            if ((!Data.getCurrentRoom().rules.ruleUserCanKick) && (Data.getCurrentRoom().rules !== "none") && (!Data.getCurrentRoom().isAdmin(Data.user.id))) {
                console.log("kick disabled")
                kickUserWindow.groupWindowButton.style.display = "none"
            } else {
                kickUserWindow.groupWindowButton.style.display = "inherit"
            }
            if (!Data.getCurrentRoom().isAdmin(Data.user.id)) {
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
        for (const key in data["users"]) {
            const userId = data["users"][key]["id"]
            Data.getCurrentRoom().users[userId] = data["users"][key]
        }
        if (inviteUsersWindow.open) {
            inviteUsersWindow.showUsersToInvite()
        }
        if (kickUserWindow.open) {
            kickUserWindow.showUsersToKick()
        }
    }
    if (data["messages"]) {
        for (const key in data["messages"]) {
            Data.getCurrentRoom().insertMessage(data["messages"][key])
        }
        Data.getCurrentRoom().showMessages()
    }
    if (data["user"]) {
        Data.user = data["user"]
    }
    if (data["yourMessage"]) {
        if (INPUT[Data.currentRoomId]["files"].length !== 0) {
            const messageId = data["yourMessage"].id
            for (const file in INPUT[Data.currentRoomId]["files"]) {
                console.log("file ", INPUT[Data.currentRoomId]["files"][file])
                uploadFile(INPUT[Data.currentRoomId]["files"][file], messageId)
            }
            INPUT.clearFileInput(Data.currentRoomId)
        }
    }
    if (data["newMessage"]) {
        console.log("newMessage", data["newMessage"])
        Data.getCurrentRoom().insertMessage(data["newMessage"])
        if (data["newMessage"]["room_id_id"] === Data.currentRoomId) {
            Data.getCurrentRoom().messages[data["newMessage"]["id"]].show()
        }
    }
    if (data["updateMessage"]) {
        const message_data = data["updateMessage"]
        console.log("UPDATE MESSAGE NEEDS REWORK")
        // createMessageDiv(message_data)
    }
    if (data["reload"]) {
        reload(data["reload"])
    }
}

function showRoomName() {
    console.log("current room", Data.currentRoomId)
    if (Data.currentRoomId !== null) {
        console.log("name", Data.getCurrentRoom().name)
        groupNameElement.innerHTML = Data.getCurrentRoom().name
    } else {
        groupNameElement.innerHTML = ''
    }
}

function wierdMessageDataParser(messageData) {
    messageData = {
        messageId: messageData["id"],
        roomId: messageData["room_id"],
        authorId: messageData["author_id_id"],
        hasMedia: messageData["has_media"],
        media: messageData["media"],
        text: messageData["message"],
        timestamp: messageData["timestamp"]
    }
    return messageData
}

groupDataDisplay.addEventListener('click', (event) => {
    if (Data.currentRoomId === null) return null
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
        this.menuGroupName.innerHTML = Data.getCurrentRoom().name
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
        this.header.innerHTML = "<span>" + "Are you sure you want to leave " + Data.currentRoomId + "?</span>"
        this.open = true
        overlay.classList.add('active')
        this.window.classList.add('active')
    },
    leaveRoom() {
        REQUESTS.requestLeaveRoom()
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
        this.header.innerHTML = "<span>" + "Are you sure you want to delete " + Data.currentRoomId + "?</span>" +
            "<span>Room data will not be recoverable.</span>"
        this.open = true
        overlay.classList.add('active')
        this.window.classList.add('active')
    },
    deleteRoom() {
        REQUESTS.requestDeleteRoom()
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
        this.renameWindowOldName.innerHTML = "<button style='margin-left: 10px'>&larr;</button>" + "<span style='margin-left: 70px'>" + 'Rename ' + Data.getCurrentRoom().name + "</span>"
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
            if (Data.currentRoomId) {
                REQUESTS.requestRenameRoom(Data.currentRoomId, this.renameRoomInput.value)
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
        if (!Data.getCurrentRoom().isOwner(Data.currentRoomId)) {
            this.setRulesWindowListAdmin.style.display = "none"
        } else {
            this.setRulesWindowListAdmin.style.display = "inherit"
        }
        this.window.classList.add("active")
        this.header.innerHTML = "<button style='margin-left: 10px'>&larr;</button>" + "<span style='margin-left: 70px'>" + 'Rules ' + Data.getCurrentRoom().name + "</span>"
        const button = this.header.getElementsByTagName('button')
        button.item(0).onclick = function () {
            setRulesWindow.closeWindow()
            GroupMenuWindow.openWindow()
        }
    },
    showRules() {
        console.log("Rules", Data.getCurrentRoom().rules)
        if ((Data.getCurrentRoom().rules !== "none") && (Data.getCurrentRoom().rules !== undefined)) {

            this.rules.ruleUserCanPost.value = Data.getCurrentRoom().rules.ruleUserCanPost
            this.rules.ruleUserCanRenameRoom.value = Data.getCurrentRoom().rules.ruleUserCanRenameRoom
            this.rules.ruleUserCanInvite.value = Data.getCurrentRoom().rules.ruleUserCanInvite
            this.rules.ruleUserCanKick.value = Data.getCurrentRoom().rules.ruleUserCanKick
            this.rules.ruleAdminCanAddAdmins.value = Data.getCurrentRoom().rules.ruleAdminCanAddAdmins
            this.rules.ruleAdminCanRemoveAdmins.value = Data.getCurrentRoom().rules.ruleAdminCanRemoveAdmins
            this.rules.ruleAdminCanRenameRoom.value = Data.getCurrentRoom().rules.ruleAdminCanRenameRoom

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
        Data.getCurrentRoom().rules = {
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
        for (const userId in Data.getCurrentRoom().users) {
            const userData = Data.getCurrentRoom().users[userId]

            console.log(userData)
            this.createUserDiv(userData)

        }
    },
    createUserDiv(userData) {
        let div = document.createElement("div");
        div.className = "user"
        div.id = "user_" + userData.id
        const Name = userData.username
        if (Data.getCurrentRoom().isOwner(Data.currentRoomId)) {
            console.log("You are an owner")
            if (Data.getCurrentRoom().isOwner(userData.id)) {
                div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "Owner" + "</div>"
            } else if (Data.getCurrentRoom().isAdmin(userData.id)) {
                div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "<button>remove admin</button>" + "</div>"
                const button = div.getElementsByTagName("button")
                button.item(0).onclick = function () {
                    REQUESTS.requestRemoveAdmin(userData.id, Data.currentRoomId)
                }
            } else {
                div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "<button>make admin</button>" + "</div>"
                const button = div.getElementsByTagName("button")
                button.item(0).onclick = function () {
                    REQUESTS.requestMakeAdmin(userData.id, Data.currentRoomId)
                }
            }
        } else if (Data.getCurrentRoom().isAdmin(Data.user.id)) {
            console.log("You are an admin")
            if (Data.getCurrentRoom().isOwner(userData.id)) {
                div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "Owner" + "</div>"
            } else if (Data.getCurrentRoom().isAdmin(userData.id)) {
                if (Data.getCurrentRoom().rules.ruleAdminCanRemoveAdmins) {
                    div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "<button>remove admin</button>" + "</div>"
                    const button = div.getElementsByTagName("button")
                    button.item(0).onclick = function () {
                        REQUESTS.requestRemoveAdmin(userData.id, Data.currentRoomId)
                    }
                } else {
                    div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "Admin" + "</div>"
                }
            } else {
                if (Data.getCurrentRoom().rules.ruleAdminCanAddAdmins) {
                    div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "<button>make admin</button>" + "</div>"
                    const button = div.getElementsByTagName("button")
                    button.item(0).onclick = function () {
                        REQUESTS.requestMakeAdmin(userData.id, Data.currentRoomId)
                    }
                } else {
                    div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "User" + "</div>"
                }
            }
        } else {
            console.log("You are a user")
            if (Data.getCurrentRoom().isOwner(userData.id)) {
                div.innerHTML = "<div class=\"user\">" + "<span>" + Name + "</span>" + "Owner" + "</div>"
            } else if (Data.getCurrentRoom().isAdmin(userData.id)) {
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

        Data.getCurrentRoom().rules = {
            ruleUserCanPost: this.rules.ruleUserCanPost.value,
            ruleUserCanRenameRoom: this.rules.ruleUserCanRenameRoom.value,
            ruleUserCanInvite: this.rules.ruleUserCanInvite.value,
            ruleUserCanKick: this.rules.ruleUserCanKick.value,
            ruleAdminCanAddAdmins: this.rules.ruleAdminCanAddAdmins.value,
            ruleAdminCanRemoveAdmins: this.rules.ruleAdminCanRemoveAdmins.value,
            ruleAdminCanRenameRoom: this.rules.ruleAdminCanRenameRoom.value,
        }
        console.log(Data.getCurrentRoom().rules)
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
        this.inviteToRoomName.innerHTML = "<button style='margin-left: 10px'>&larr;</button>" + "<span style='margin-left: 70px'>" + "Invite to " + Data.getCurrentRoom().name + "</span>"
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
        for (const userId in Data.allUsers) {
            const userData = Data.allUsers[userId]
            if ((Data.getCurrentRoom().users.find((user) => user.id === userData.id) === undefined)) {
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
            REQUESTS.requestInviteUser(user.id, Data.currentRoomId)
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
        this.kickWindowHeader.innerHTML = "<button style='margin-left: 10px'>&larr;</button>" + "<span style='margin-left: 70px'>" + "Kick from " + Data.getCurrentRoom().name + "</span>"
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
        for (const user in Data.allUsers) {
            const userData = Data.allUsers[user]
            if ((Data.getCurrentRoom().users.find((user) => user.id === userData.id) !== undefined) && (Data.allUsers[user].id !== Data.user.id)) {
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
            REQUESTS.requestKickUser(user.id, Data.currentRoomId)
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
        for (const userId in Data.allUsers) {
            const userData = Data.allUsers[userId]
            if ((Data.allUsers[userId].id !== Data.user.id)) {
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