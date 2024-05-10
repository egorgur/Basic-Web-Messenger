const baseURL = window.location.protocol + "//" + window.location.host + "/"
console.log(baseURL)
const inputOldPassword = document.getElementById('oldPassword')
const inputNewPasswordFirst = document.getElementById('newPassword1')
const inputNewPasswordSecond = document.getElementById('newPassword2')
const infoLabel = document.getElementById("error-popup")
const DATA = {
    oldPass: "",
    firstPass: "",
    secondPass: "",
    valid: false,
}

document.addEventListener("keyup", function (event) {
    if (inputOldPassword.value === "") {
        DATA.oldPass = ""
        DATA.firstPass = ""
        DATA.secondPass = ""
        DATA.valid = false
        infoLabel.textContent = "Enter old password"
        infoLabel.classList.add("active")
    } else if (inputNewPasswordFirst.value === "" || inputNewPasswordSecond.value === "") {
        DATA.oldPass = ""
        DATA.firstPass = ""
        DATA.secondPass = ""
        DATA.valid = false
        infoLabel.textContent = "Enter new password"
        infoLabel.classList.add("active")
    } else if (inputNewPasswordFirst.value !== inputNewPasswordSecond.value) {
        DATA.oldPass = ""
        DATA.firstPass = ""
        DATA.secondPass = ""
        DATA.valid = false
        infoLabel.textContent = "New password in the both fields must match"
        infoLabel.classList.add("active")
    } else {
        DATA.oldPass = inputOldPassword.value
        DATA.firstPass = inputNewPasswordFirst.value
        DATA.secondPass = inputNewPasswordSecond.value
        DATA.valid = true
        infoLabel.textContent = ""
        infoLabel.classList.remove("active")
    }
})

function sendPasswords() {
    if (DATA.valid) {
        const SavePasswordURL = baseURL + "messenger/account/password/save"
        sendRequest("POST", SavePasswordURL, DATA)
            .then(data => {
                console.log(data)
                if (data.answer_type === "good") {
                    window.location.href = baseURL + "messenger/account"
                } else {
                    infoLabel.innerHTML = data.comment
                    infoLabel.classList.add("active")
                }
            })
            .catch(err => {
                console.log(err)
            })
    }
}

document.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        console.log(DATA)
        if ((DATA.oldPass !== "") && (DATA.firstPass === DATA.secondPass)) {
            sendPasswords()
        }
    }
})
