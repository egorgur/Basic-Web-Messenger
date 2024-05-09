let baseURL = window.location.protocol + "//" + window.location.host + "/"
console.log(baseURL)
let input_name_field = document.getElementById('username')
let infoText = document.getElementById('error-popup')
const avatarImage = document.getElementById("avatarImage")
const avatarInput = document.getElementById("avatarInput")

DATA = {
    name: "",
}

avatarInput.onchange = (event) => {
    const [file] = avatarInput.files
    if (file) {
        avatarImage.src = URL.createObjectURL(file)
    } else {
        avatarImage.src = emptyAvatarUrl
    }
}
document.addEventListener("keyup", function (event) {
    DATA.name = input_name_field.value
    if (input_name_field.value === "") {
        DATA.name = ""
        infoText.textContent = "Account name cannot be empty"
        infoText.classList.add("active")

    } else {
        DATA.name = input_name_field.value
        infoText.textContent = "Account"
        infoText.classList.remove("active")
    }
    if (event.key === "Enter") {
        if (!(DATA.name === "" || DATA.password === "")) {
            sendAccountData()
        }
    }
})

function sendAccountData() {
    const saveAccountDataURL = baseURL + "messenger/account/save"
    const [file] = avatarInput.files
    if (file) {
        uploadAvatar(file)
    }
    if (DATA.name !== "") {
        sendRequest("POST", saveAccountDataURL, DATA)
            .then(data => {
                console.log(data)
                if (data.answer_type === "good") {
                    window.location.reload()
                } else {
                    infoText.textContent = data.comment
                    infoText.classList.add("active")
                }
            })
            .catch(err => {
                console.log(err)
            })
    }
}

function changePassRedirect() {
    window.location.href = baseURL + "messenger/account/password/"
}

function leaveAccount() {
    window.location.href = baseURL + "messenger/account/leave"
}

function uploadAvatar(file) {
    const url = "http://" + window.location.host + "/messenger/files/"
    let form = new FormData();
    form.append("file", file)
    form.append("account_avatar", true)
    form.append("enctype", "multipart/form-data")
    console.log("form", ...form)
    const xhr = new XMLHttpRequest();

    xhr.open("POST", url, true);

    xhr.setRequestHeader('X-CSRFToken', CSRF_TOKEN);

    xhr.send(form);
    console.log(xhr.response)
}
