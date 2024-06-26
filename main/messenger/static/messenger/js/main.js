const baseURL = window.location.protocol + "//" + window.location.host + "/"
console.log(baseURL)
const roomsDiv = document.getElementById('rooms')
const messageDiv = document.getElementById('messages')
const groupNameElement = document.getElementById('groupDataDisplay')
const roomName = document.getElementById("roomName")
const chatHeader = document.getElementById('chatHeader')
const overlay = document.getElementById('overlay')

roomsDiv.style.height = (window.innerHeight - 180).toString() + "px"
roomsDiv.style.flexGrow = "0"

messageDiv.style.height = (window.innerHeight - 264).toString() + "px"
messageDiv.style.flexGrow = "0"

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
        this.showChat()
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
    showChat() {
        chatHeader.style.display = ""
        messageDiv.style.display = ""
        INPUT.chatInputContainer.style.display = ""
    },
    hideChat() {
        chatHeader.style.display = "none"
        messageDiv.style.display = "none"
        INPUT.chatInputContainer.style.display = "none"
    },
    createRoomDiv(roomData) {
        let div = document.createElement("div");
        div.className = "messenger__room"
        div.onclick = function () {
            Data.chooseRoom(roomData.id)
        }
        div.innerHTML = roomData.name;
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
            this.hideChat()
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
                const author = Data.allUsers[messageData.authorId]
                div.className = "messenger__chat-message"
                if (messageData.authorId === Data.user.id) {
                    div.classList.add("messenger__chat-message--user")
                }
                div.style.order = messageData["order"]
                div.id = "message_" + messageData["messageId"]
                let authorIconHref = emptyAvatarHref
                if (author.userAvatar !== "") {
                    authorIconHref = "http://" + window.location.host + author.userAvatar
                }
                div.innerHTML = "<img class='author-icon' src=" + authorIconHref + " alt=" + author.username[0] + " height=\"50px\" width='50px' id=\"avatarImage\">"
                div.innerHTML += "<div class='message-content'></div>"
                const content = div.getElementsByTagName("div")[0]
                content.innerHTML = "<div class='message-author'>" + author.username + "</div>"
                content.innerHTML += "<div class='message-text'>" + messageData.text + "</div>"

                for (const file in messageData["media"]) {
                    const fileData = messageData["media"][file]
                    // console.log(fileData)
                    const format = fileData['file'].split('.').pop()
                    // console.log("format ", format)
                    const mediaHref = "http://" + window.location.host + "/media/" + fileData['file']
                    if (["mp4", "webm"].find(value => value === format)) {
                        content.innerHTML += "<div class='message-file'>" + "<video style='max-width: 400px' src=\'" + mediaHref + "\' controls/>" + "</div>"
                    } else if (["jpg", "jpeg", "png", "gif"].find(value => value === format)) {
                        content.innerHTML += "<div class='message-file'>" + "<img style='max-width: 400px' src=\'" + mediaHref + "\' alt=''/>" + "</div>"
                    } else if (["waw", "mp3"].find(value => value === format)) {
                        content.innerHTML += "<div class='message-file'>" + "<audio style='' src=\'" + mediaHref + "\' controls/>" + "</div>"
                    } else {
                        content.innerHTML +=
                            "<div class='message-file' style='min-height: 40px; margin: 5px 0;' class=\'flex-r a-c\'>"
                            + "<a style='max-width: 400px;' href=\'" + mediaHref + "\'> File: " + fileData["file_name"] + "</a>"
                            + "</div>"
                    }
                }
            },
            createMessageDiv(messageData) {
                // console.log("messageData", messageData)
                const div = document.createElement("div");
                const author = Data.allUsers[messageData.authorId]
                div.className = "messenger__chat-message"
                if (messageData.authorId === Data.user.id) {
                    div.classList.add("messenger__chat-message--user")
                }
                div.style.order = messageData["order"]
                div.id = "message_" + messageData["messageId"]
                let authorIconHref = emptyAvatarHref
                if (author.userAvatar !== "") {
                    authorIconHref = "http://" + window.location.host + author.userAvatar
                }
                div.innerHTML = "<img class='author-icon' src=" + authorIconHref + " alt=" + author.username[0] + " height=\"50px\" width='50px' id=\"avatarImage\">"
                div.innerHTML += "<div class='message-content'></div>"
                const content = div.getElementsByTagName("div")[0]
                content.innerHTML = "<div class='message-author'>" + author.username + "</div>"
                content.innerHTML += "<div class='message-text'>" + messageData.text + "</div>"

                for (const file in messageData["media"]) {
                    const fileData = messageData["media"][file]
                    // console.log(fileData)
                    const format = fileData['file'].split('.').pop()
                    // console.log("format ", format)
                    const mediaHref = "http://" + window.location.host + "/media/" + fileData['file']
                    if (["mp4", "webm"].find(value => value === format)) {
                        content.innerHTML += "<div class='message-file'>" + "<video style='max-width: 400px' src=\'" + mediaHref + "\' controls/>" + "</div>"
                    } else if (["jpg", "jpeg", "png", "gif"].find(value => value === format)) {
                        content.innerHTML += "<div class='message-file'>" + "<img style='max-width: 400px' src=\'" + mediaHref + "\' alt=''/>" + "</div>"
                    } else if (["waw", "mp3"].find(value => value === format)) {
                        content.innerHTML += "<div class='message-file'>" + "<audio style='' src=\'" + mediaHref + "\' controls/>" + "</div>"
                    } else {
                        content.innerHTML +=
                            "<div class='message-file' style='min-height: 40px; margin: 5px 0;' class=\'flex-r a-c\'>"
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
                            messageData["order"] = this.order
                            // console.log("messageShow", this.messageId, this)
                            if (this.element === null) {
                                Data.rooms[roomId].createMessageDiv(messageData)
                                this.element = document.getElementById("message_" + this.messageId)
                            } else {
                                this.element.style.order = this.order
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
                if (this.scrollPosition !== null) {
                    console.log("scrollTo", this.scrollPosition)
                    messageDiv.scrollTo(0, this.scrollPosition)
                }
            },
            hideMessages() {
                Object.keys(this.messages).reverse().forEach((messageId) => {
                    // console.log("messageHide", messageId, this.messages[parseInt(messageId)])
                    this.messages[parseInt(messageId)].hide()
                })
            },
            isAdmin(userId) {
                console.log("is Admin", userId in this.admins)
                return userId in this.admins
            },
            isOwner(userId) {
                console.log("is Owner", userId === this.ownerId)
                return userId === this.ownerId
            },
        }
    },
}

const INPUT = {
    textInputElement: document.getElementById('textInput'),
    textInputContainer: document.getElementById("textInputContainer"),
    chatInputContainer: document.getElementById("chatInputContainer"),
    sendMessageButton: document.getElementById("sendMessageButton"),
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


window.addEventListener("resize", activeWindowsResize)

function activeWindowsResize() {
    const InputContainerHeight = parseInt(INPUT.chatInputContainer.style.height)
    if (InputContainerHeight <= 400) {
        roomsDiv.style.height = (window.innerHeight - 180).toString() + "px"
        messageDiv.style.height = (window.innerHeight - 204 - InputContainerHeight).toString() + "px"
        // console.log(InputContainerHeight)
        // console.log(roomsDiv.style.height, messageDiv.style.height)
    }
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
        if (INPUT[Data.currentRoomId]["text"]) {
            sendMessage()
            INPUT.textInputElement.value = ""
            INPUT.textInputElement.style.height = "17px"
        }
    }
});

INPUT.textInputElement.addEventListener("input", (event) => {
    INPUT.textInputElement.style.height = "1px";
    INPUT.textInputElement.style.height = (INPUT.textInputElement.scrollHeight) + "px";
    const height = parseInt(INPUT.textInputElement.style.height) + 43
    INPUT.chatInputContainer.style.height = height.toString() + "px"
    activeWindowsResize()
})

messageDiv.addEventListener("scroll", function () {
    debounce(getScrollPosition, 100)
})


const lastToScrollElement = document.getElementById("lastToScrollElement")

function debounce(method, delay) {
    clearTimeout(method._tId);
    method._tId = setTimeout(function () {
        method();
    }, delay);
}

function getScrollPosition() {
    let y = -messageDiv.scrollTop
    Data.getCurrentRoom().scrollPosition = -y
    let offset = -lastToScrollElement.offsetTop
    console.log("y", y, "pointerDivHeight", offset, "offset - y", offset - y); // scroll position from top
    if (offset - y < 100) {
        REQUESTS.requestRoomMessages(Data.getCurrentRoom().messagesRequestsCount)
    }
}

function sendMessage() {
    if (Data.currentRoomId !== null) {
        messageDiv.scrollTo(0, 0)
        let text = INPUT.textInputElement.value
        if (text !== "") {
            text = text.replace(/\r\n|\r|\n/g, "</br>")
            websocket.send(JSON.stringify({
                message: text,
                room_id: Data.currentRoomId,
                request: "send_message",
                has_media: INPUT.getFiles(Data.currentRoomId,).length > 0,
            }))
            INPUT.textInputElement.value = ""
            INPUT.textInputElement.style.height = "1px";
            INPUT.textInputElement.style.height = (INPUT.textInputElement.scrollHeight) + "px";
            const height = parseInt(INPUT.textInputElement.style.height) + 43
            INPUT.chatInputContainer.style.height = height.toString() + "px"
            activeWindowsResize()
        }

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

function clearFromJsCode(message) {
    const first = message.replace("<script>", "<text>")
    return first.replace("</script>", "</text>")
}

function websocketDataHandler(data) {
    console.log('from-server:', data)
    if (data["rooms"]) {

        for (const key in data["rooms"]) {
            const roomData = data["rooms"][key]
            if (Data.rooms[roomData["id"]] === undefined) {
                Data.createRoomDiv(roomData)
                Data.addRoom(roomData["id"])
                Data.rooms[roomData["id"]].name = roomData["name"]
                Data.rooms[roomData["id"]].rules = roomData["rules"]
            } else {
                Data.rooms[roomData["id"]].name = roomData["name"]
                Data.rooms[roomData["id"]].rules = roomData["rules"]
            }
        }
        for (const roomId in Data.rooms) {
            let deleteFlag = true
            console.log("find", data["rooms"].find((room) => {
                console.log("room.id", room.id, "roomId", roomId);
                return room.id === parseInt(roomId)
            }))
            if (data["rooms"].find((room) => {
                console.log(data["rooms"], room);
                return room.id === parseInt(roomId)
            }) !== undefined) {
                deleteFlag = false
            }
            if (deleteFlag) {
                Data.deleteRoom(roomId)
            }
        }
    }
    if (data["allUsers"]) {
        for (const key in data["allUsers"]) {
            const userId = data["allUsers"][key]["id"]
            Data.allUsers[userId] = data["allUsers"][key]
        }
        if (newRoomWindow.open) {
            newRoomWindow.openWindow()
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
                INPUT.textInputElement.setAttribute("placeholder", "Write a message...")
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
            if (!Data.getCurrentRoom().isOwner(Data.user.id)) {
                deleteConfirmWindow.groupWindowButton.style.display = "none"
            } else {
                deleteConfirmWindow.groupWindowButton.style.display = "inherit"
            }
        } else {
            console.log("input activated")
            INPUT.textInputElement.removeAttribute("disabled")
            INPUT.textInputElement.setAttribute("placeholder", "Write a message...")
            RoomRenameWindow.groupWindowButton.style.display = "inherit"
            inviteUsersWindow.groupWindowButton.style.display = "inherit"
            kickUserWindow.groupWindowButton.style.display = "inherit"
            setRulesWindow.groupWindowButton.style.display = "inherit"
        }
    }
    if (data["users"]) {
        Data.getCurrentRoom().users = {}
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
            data["messages"][key]["message"] = clearFromJsCode(data["messages"][key]["message"])
            Data.rooms[data["messages"][key]["room_id_id"]].insertMessage(data["messages"][key])
        }
        Data.getCurrentRoom().showMessages()
        if (data["messages"].length > 9) {
            Data.getCurrentRoom().messagesRequestsCount++
        }
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
        data["newMessage"]["message"] = clearFromJsCode(data["newMessage"]["message"])
        Data.rooms[data["newMessage"]["room_id_id"]].insertMessage(data["newMessage"])
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
        roomName.innerHTML = Data.getCurrentRoom().name
    } else {
        roomName.innerHTML = ''
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

chatHeader.addEventListener('click', (event) => {
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
        Data.deleteRoom(Data.currentRoomId)
        showRoomName()
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
    groupWindowButton: document.getElementById("groupDelete"),
    header: document.getElementById("deleteConfirmHeader"),
    window: document.getElementById("deleteConfirm"),
    openWindow() {
        this.header.innerHTML = "<div>" + "Are you sure you want to delete " + Data.getCurrentRoom().name + "?</div>" +
            "<div>Room data will not be recoverable.</div>"
        this.open = true
        overlay.classList.add('active')
        this.window.classList.add('active')
    },
    deleteRoom() {
        REQUESTS.requestDeleteRoom()
        this.closeWindow()
        overlay.classList.remove('active')
        Data.deleteRoom(Data.currentRoomId)
        showRoomName()
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
        this.renameWindowOldName.innerHTML = "<span style=''>" + 'Rename ' + Data.getCurrentRoom().name + "</span>"
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
        if (!Data.getCurrentRoom().isOwner(Data.user.id)) {
            this.setRulesWindowListAdmin.style.display = "none"
        } else {
            this.setRulesWindowListAdmin.style.display = "flex"
        }
        this.window.classList.add("active")
        this.header.innerHTML = "<span>" + 'Rules ' + Data.getCurrentRoom().name + "</span>"
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
        div.className = "modal__scroll-list-component modal--room-rules__scroll-list-component"
        div.id = "user_" + userData.id
        console.log(div.id)
        const Name = userData.username
        if (Data.getCurrentRoom().isOwner(Data.user.id)) {
            console.log("You are an owner")
            if (Data.getCurrentRoom().isOwner(userData.id)) {
                div.innerHTML = "<span>" + Name + "</span>" + "Owner"
            } else if (Data.getCurrentRoom().isAdmin(userData.id)) {
                div.innerHTML = "<span>" + Name + "</span>" + "<button class='btn' style='padding: 0 3px;border: none;'>remove admin</button>"
                const button = div.getElementsByTagName("button")
                button.item(0).onclick = function () {
                    REQUESTS.requestRemoveAdmin(userData.id, Data.currentRoomId)
                }
            } else {
                div.innerHTML = "<span>" + Name + "</span>" + "<button class='btn' style='padding: 0 3px;border: none;'>make admin</button>"
                const button = div.getElementsByTagName("button")
                button.item(0).onclick = function () {
                    REQUESTS.requestMakeAdmin(userData.id, Data.currentRoomId)
                }
            }
        } else if (Data.getCurrentRoom().isAdmin(Data.user.id)) {
            console.log("You are an admin")
            if (Data.getCurrentRoom().isOwner(userData.id)) {
                div.innerHTML = "<div>" + Name + "</div>" + "Owner"
            } else if (Data.getCurrentRoom().isAdmin(userData.id)) {
                if (Data.getCurrentRoom().rules.ruleAdminCanRemoveAdmins) {
                    div.innerHTML = "<div>" + Name + "</div>" + "<button class='btn' style='padding: 0 3px;border: none;'>remove admin</button>"
                    const button = div.getElementsByTagName("button")
                    button.item(0).onclick = function () {
                        REQUESTS.requestRemoveAdmin(userData.id, Data.currentRoomId)
                    }
                } else {
                    div.innerHTML = "<div>" + Name + "</div>" + "Admin"
                }
            } else {
                if (Data.getCurrentRoom().rules.ruleAdminCanAddAdmins) {
                    div.innerHTML = "<div>" + Name + "</div>" + "<button class='btn' style='padding: 0 3px;border: none;'>make admin</button>"
                    const button = div.getElementsByTagName("button")
                    button.item(0).onclick = function () {
                        REQUESTS.requestMakeAdmin(userData.id, Data.currentRoomId)
                    }
                } else {
                    div.innerHTML = "<div>" + Name + "</div>" + "User"
                }
            }
        } else {
            console.log("You are a user")
            if (Data.getCurrentRoom().isOwner(userData.id)) {
                div.innerHTML = "<div>" + Name + "</div>" + "Owner"
            } else if (Data.getCurrentRoom().isAdmin(userData.id)) {
                div.innerHTML = "<div>" + Name + "</div>" + "Admin"
            } else {
                div.innerHTML = "<div>" + Name + "</div>" + "User"
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
    inviteToRoomHeader: document.getElementById("inviteToRoomHeader"),
    inviteUsersDiv: document.getElementById("inviteUsersDiv"),
    openWindow() {
        this.inviteToRoomHeader.innerHTML = "<div>" + "Invite to " + Data.getCurrentRoom().name + "</div>"
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
            if ((Data.getCurrentRoom().users[userData.id] === undefined) && (userData.id !== Data.user.id)) {
                console.log(userData)
                this.createUserDiv(userData)
            }
        }
    },
    createUserDiv(user) {
        let div = document.createElement("div");
        div.className = "modal__scroll-list-component modal--invite-user__scroll-list-component"
        div.id = "user_" + user.id
        const Name = user.username
        div.innerHTML = "<span>" + Name + "</span>" + "<button class='btn' style='padding: 0 3px;border: none;'>Invite</button>"
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
        this.kickWindowHeader.innerHTML = "<div>" + "Kick from " + Data.getCurrentRoom().name + "</div>"
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
            if ((Data.getCurrentRoom().users[userData.id] !== undefined) && (userData.id !== Data.user.id) && (userData.id !== Data.getCurrentRoom().ownerId)) {
                console.log(userData)
                this.createUserDiv(userData)
            }
        }
    },
    createUserDiv(user) {
        let div = document.createElement("div");
        div.className = "modal__scroll-list-component modal--kick-user__scroll-list-component"
        div.id = "user_" + user.id
        const Name = user.username
        div.innerHTML = "<span>" + Name + "</span>" + "<button class='btn' style='padding: 0 3px;border: none;'>Kick</button>"
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
        if (!this.open) {
            REQUESTS.requestAllUsers()
        }
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
        this.closeWindow()
    },
    showUsers() {
        this.users.replaceChildren()
        for (const userId in Data.allUsers) {
            const userData = Data.allUsers[userId]
            console.log("userData", userData)
            if ((Data.allUsers[userId].id !== Data.user.id)) {
                this.createUserDiv(userData)
            }
        }
    },
    createUserDiv(user) {
        let div = document.createElement("div");
        div.className = "modal__scroll-list-component modal--new-room__scroll-list-component"
        div.id = "user_" + user.id
        const Name = user.username
        div.innerHTML = Name + "<button class='btn' style='padding: 0 3px;border: none;'>Add</button>" + "<span style='display: none' id='notchosen'></span>"
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