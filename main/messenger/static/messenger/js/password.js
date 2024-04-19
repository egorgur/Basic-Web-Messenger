let baseURL = window.location.protocol + "//" + window.location.host + "/"
console.log(baseURL)
let inputOldPassword = document.getElementById('oldPassword')
let inputNewPasswordFirst = document.getElementById('newPassword1')
let inputNewPasswordSecond = document.getElementById('newPassword2')
let infoLabel = document.getElementById("mark")
let DATA = {
    oldPass: "",
    firstPass: "",
    secondPass: "",
}

function DataCheck() {
    if (inputOldPassword.value === "") {
        DATA.oldPass = ""
        DATA.firstPass = ""
        DATA.secondPass = ""
        infoLabel.innerText = "Enter old password"
        setTimeout(DataCheck, 1000)
    } else if (inputNewPasswordFirst.value === "" || inputNewPasswordSecond.value === "") {
        DATA.oldPass = ""
        DATA.firstPass = ""
        DATA.secondPass = ""
        infoLabel.innerText = "Enter new password"
        setTimeout(DataCheck, 1000)
    } else if (inputNewPasswordFirst.value !== inputNewPasswordSecond.value) {
        DATA.oldPass = ""
        DATA.firstPass = ""
        DATA.secondPass = ""
        infoLabel.innerText = "New password in both fields must match"
        setTimeout(DataCheck, 1000)
    } else {
        DATA.oldPass = inputOldPassword.value
        DATA.firstPass = inputNewPasswordFirst.value
        DATA.secondPass = inputNewPasswordSecond.value
        infoLabel.innerText = ""
        setTimeout(DataCheck, 1000)
    }
}

DataCheck()

function sendPasswords() {
    const SavePasswordURL = baseURL + "messenger/account/password/save"
    sendRequest("POST", SavePasswordURL, DATA)
        .then(data => {
            console.log(data)
            if (data.answer_type === "good"){
                window.location.href = baseURL + "messenger/login"
            }
        })
        .catch(err => {
            console.log(err)
        })
}

document.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        console.log(DATA)
        if ((DATA.oldPass !== "")&&(DATA.firstPass===DATA.secondPass)) {
            sendPasswords()
        }
    }
})
