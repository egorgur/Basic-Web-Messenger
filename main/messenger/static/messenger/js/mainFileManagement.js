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

window.window.addEventListener("drop", (event) => {
        event.preventDefault()
        event.stopPropagation()
        let box = dropZone.window.getBoundingClientRect();
        if (((box.left - 1 <= event.x) && (event.x <= box.right + 1)) && ((box.top - 1 <= event.y) && (event.y <= box.bottom + 1))) {
            console.log("drop", event)
            console.log("drop", event.dataTransfer.files)
            if (DATA.currentRoom.id !== null) {
                if (INPUT[DATA.currentRoom.id]) {
                    INPUT[DATA.currentRoom.id]["files"] = event.dataTransfer.files
                } else {
                    INPUT[DATA.currentRoom.id] = {
                        text: "",
                        files: event.dataTransfer.files
                    }
                }
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
