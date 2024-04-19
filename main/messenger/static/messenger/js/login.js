let baseURL = window.location.protocol + "//" + window.location.host + "/"
console.log(baseURL)
let input_name_field = document.getElementById('input_name')
let input_password_field = document.getElementById('input_password')
let infoLabel = document.getElementById('info')
console.dir(input_name_field)
console.dir(input_password_field)
console.dir(infoLabel)

let DATA = {
    request: "login",
    name: "",
    password: "",
}

function DataCheck() {
    if (input_password_field.value === "" || input_name_field.value === "") {
        infoLabel.innerText = "Enter login and password"
    } else if (!(input_name_field.value === "" || input_password_field.value === "")) {
        infoLabel.innerText = "Press Enter"
    }
    setTimeout(DataCheck, 1000)
}

DataCheck()

function sendLoginUser() {
    const managementURL = baseURL + "messenger/management/"
    sendRequest("POST", managementURL, DATA)
        .then(data => {
            console.log(data)
            if (data.answer_type === "good"){
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
        DATA.name = input_name_field.value
        DATA.password = input_password_field.value
        console.log(DATA)
        if (!(DATA.name === "" || DATA.password === "")) {
            sendLoginUser()
        }
    }
})

