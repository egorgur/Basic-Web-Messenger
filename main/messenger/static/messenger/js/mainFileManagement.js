const dragToZone = document.querySelector(".column-wrapper")

const dropZone = {
    open: false,
    window: document.getElementById("dropZoneWindow"),
    openWindow() {
        this.window.classList.add("active")
    },
    onDrop() {
        this.window.style.border = "1px red solid"
    },
    closeWindow() {
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
        if (INPUT[DATA.currentRoom.id]) {
            for (const file in INPUT[DATA.currentRoom.id]["files"]) {
                const fileData = INPUT[DATA.currentRoom.id]["files"][file]
                this.createFileDiv(file, fileData)
            }
        }
    },
    createFileDiv(file, fileData) {
        let div = document.createElement("div");
        div.className = "filePreview"
        div.id = "file_" + file
        const Name = fileData.name
        div.innerHTML = "<span>" + Name + "</span>" + "<button>" + "&times;" + "</button>"
        const button = div.getElementsByTagName("button")
        button.item(0).onclick = function () {
            INPUT[DATA.currentRoom.id]["files"].splice(file, 1)
            fileInputWindow.showFiles()
        }
        this.window.appendChild(div);
    },
    closeWindow() {
        this.window.replaceChildren()
    },
}

window.window.addEventListener("drop", (event) => {
        event.preventDefault()
        event.stopPropagation()
        let box = dropZone.window.getBoundingClientRect();
        if (((box.left - 1 <= event.x) && (event.x <= box.right + 1)) && ((box.top - 1 <= event.y) && (event.y <= box.bottom + 1))) {
            console.log("drop", event)
            console.log("drop", event.dataTransfer.files)
            if (DATA.currentRoom.id !== null) {
                if (INPUT[DATA.currentRoom.id]) {
                    INPUT[DATA.currentRoom.id]["files"].push(event.dataTransfer.files[0])
                } else {
                    INPUT[DATA.currentRoom.id] = {
                        text: "",
                        files: [event.dataTransfer.files[0]]
                    }
                }
                fileInputWindow.openWindow()
            }
            dropZone.closeWindow()
            dropZone.window.style.border = '#1b6d85 1px dashed'
        }
    }
)
window.addEventListener("dragover", (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (DATA.currentRoom.id !== null) {
        dropZone.openWindow()
        let box = dropZone.window.getBoundingClientRect();
        if (((box.left - 1 <= event.x) && (event.x <= box.right + 1)) && ((box.top - 1 <= event.y) && (event.y <= box.bottom + 1))) {
            dropZone.window.style.border = '1px red solid'
        }
    }
})

window.addEventListener("dragleave", (event) => {
    if (event.x === 0 && event.y === 0) {
        dropZone.closeWindow()
        dropZone.window.style.border = '#1b6d85 1px dashed'
    } else if (event.target === dropZone.window) {
        dropZone.window.style.border = '#1b6d85 1px dashed'
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

function uploadFile(file) {
    const url = "http://" + window.location.host + "/messenger/files/"

    let form = new FormData();
    form.append("file", file)
    form.append("enctype", "multipart/form-data")
    console.log("form",...form)
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

}

