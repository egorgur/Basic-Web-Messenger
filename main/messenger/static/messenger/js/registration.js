let baseURL = window.location.protocol + "//" + window.location.host + "/"
console.log(baseURL)
let input_name_field = document.getElementById('input_name')
let input_password_field = document.getElementById('input_password1')
let input_password_repeat_field = document.getElementById('input_password2')
let infoLabel = document.getElementById('password_warning')
console.dir(input_name_field)
console.dir(input_password_field)
console.dir(input_password_repeat_field)
console.dir(infoLabel)
let DATA = {
    request: "registration",
    name: "",
    password: "",
}

function DataCheck() {
    DATA.name = input_name_field.value
    if (!(input_password_field.value === "" || input_password_repeat_field.value === "") && (input_password_field.value !== input_password_repeat_field.value)) {
        infoLabel.innerText = "Passwords are not matched"
        DATA.password = ""
    } else if ((input_name_field.value !== "") && !(input_password_field.value === "" || input_password_repeat_field.value === "")) {
        infoLabel.innerText = "Press Enter"
        DATA.password = input_password_field.value
    } else {
        infoLabel.innerText = ""
        DATA.password = input_password_field.value
    }
    setTimeout(DataCheck, 1000)
}

DataCheck()

function sendRegisteredUser() {
    const managementURL = baseURL + "messenger/management/"
    sendRequest("POST", managementURL, DATA)
        .then(data => {
            console.log(data)
            if (data.answer_type === "good") {
                console.log(baseURL + data.main_data.redirect)
                window.location.href = baseURL + data.main_data.redirect
            }
        })
        .catch(err => {
            console.log(err)
        })
}

document.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        if (!(DATA.name === "" || DATA.password === "")) {
            sendRegisteredUser()
        }
    }
})