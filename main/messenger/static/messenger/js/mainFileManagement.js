const fileInput = document.getElementById("fileInput")



fileInput.onchange = (event) => {
    const [file] = fileInput.files
    if (file) {
        if (Data.currentRoomId !== null) {
                if (INPUT[Data.currentRoomId]) {
                    INPUT[Data.currentRoomId]["files"].push(file)
                } else {
                    INPUT[Data.currentRoomId] = {
                        text: "",
                        files: [file]
                    }
                }
                fileInputWindow.openWindow()
            }
        fileInput.files = []
    }
}



const dropZone = {
    open: false,
    window: document.getElementById("dropZoneWindow"),
    openWindow() {
        this.open = true
        this.window.classList.add("active")
    },
    onDrop() {
        this.window.style.border = "1px red solid"
    },
    closeWindow() {
        this.open = false
        this.window.classList.remove("active")
    },
}

const fileInputWindow = {
    open: true,
    window: document.getElementById("files"),
    openWindow() {
        this.showFiles()
    },
    showFiles() {
        this.window.replaceChildren()
        if (INPUT[Data.currentRoomId]) {
            for (const file in INPUT[Data.currentRoomId]["files"]) {
                const fileData = INPUT[Data.currentRoomId]["files"][file]
                this.createFileDiv(file, fileData)
            }
        }
    },
    createFileDiv(file, fileData) {
        let div = document.createElement("div");
        div.className = "filePreview"
        div.id = "file_" + file
        const Name = fileData.name
        div.innerHTML = "<span>" + Name + "</span>" + "<button style='padding-left: 5px;background: none;font-size: 1.25em' >" + "&times;" + "</button>"
        const button = div.getElementsByTagName("button")
        button.item(0).onclick = function () {
            INPUT[Data.currentRoomId]["files"].splice(file, 1)
            fileInputWindow.showFiles()
        }
        this.window.appendChild(div);
    },
    closeWindow() {
        this.window.replaceChildren()
    },
}

window.addEventListener("drop", (event) => {
        event.preventDefault()
        event.stopPropagation()
        let box = dropZone.window.getBoundingClientRect();
        if (((box.left - 1 <= event.x) && (event.x <= box.right + 1)) && ((box.top - 1 <= event.y) && (event.y <= box.bottom + 1))) {
            if (Data.currentRoomId !== null) {
                if (INPUT[Data.currentRoomId]) {
                    INPUT[Data.currentRoomId]["files"].push(event.dataTransfer.files[0])
                } else {
                    INPUT[Data.currentRoomId] = {
                        text: "",
                        files: [event.dataTransfer.files[0]]
                    }
                }
                fileInputWindow.openWindow()
            }
            dropZone.closeWindow()
            dropZone.window.style.border = '#595959FF 1px dashed'
        } else {
            dropZone.closeWindow()
            dropZone.window.style.border = '#595959FF 1px dashed'
        }
    }
)
window.addEventListener("dragover", (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (Data.currentRoomId !== null) {
        dropZone.openWindow()
        let box = dropZone.window.getBoundingClientRect();
        if (((box.left - 1 <= event.x) && (event.x <= box.right + 1)) && ((box.top - 1 <= event.y) && (event.y <= box.bottom + 1))) {
            dropZone.window.style.border = '1px white solid'
        }
    }
})

window.addEventListener("dragleave", (event) => {
    if (event.x === 0 && event.y === 0) {
        dropZone.closeWindow()
        dropZone.window.style.border = '#595959FF 1px dashed'
    } else if (event.target === dropZone.window) {
        dropZone.window.style.border = '#595959FF 1px dashed'
    }
    event.preventDefault()
    event.stopPropagation()
})


window.addEventListener("dragend", (event) => {
    event.preventDefault()
    event.stopPropagation()
    console.log("end", event)
    dropZone.closeWindow()
})

function uploadFile(file, messageId) {
    fileInputWindow.showFiles()
    const url = "http://" + window.location.host + "/messenger/files/"

    let form = new FormData();
    form.append("file", file)
    form.append("roomId", Data.currentRoomId)
    form.append("messageId", messageId)
    form.append("enctype", "multipart/form-data")
    console.log("form", ...form)
    const xhr = new XMLHttpRequest();

    // xhr.upload.onprogress = function (event) {
    //     console.log(event.loaded + ' / ' + event.total);
    // }
    // xhr.onload = function (event) {
    //     console.log(event)
    // };
    // xhr.onerror = function (event) {
    //     console.log(event)
    // };
    // xhr.onloadend = function (event){
    //     console.log(event)
    // }

    xhr.open("POST", url, true);

    xhr.setRequestHeader('X-CSRFToken', CSRF_TOKEN);

    xhr.send(form);
    console.log(xhr.response)
}

