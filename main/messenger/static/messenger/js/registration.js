let baseURL = window.location.protocol + "//" + window.location.host + "/"
console.log(baseURL)
let input_name_field = document.getElementById('username')
let input_password_field = document.getElementById('password1')
let input_password_repeat_field = document.getElementById('password2')
let infoLabel = document.getElementById('error-popup')
console.dir(input_name_field)
console.dir(input_password_field)
console.dir(input_password_repeat_field)
console.dir(infoLabel)
let DATA = {
    request: "registration",
    name: "",
    password: "",
}

document.getElementById("loginRedirect").onclick = () => {
    window.location.href = baseURL + "messenger/login"
}

infoLabel.innerText = "Enter a username and a password for your account"
infoLabel.classList.add("active")
function sendRegisteredUser() {
    if (!(DATA.name === "" || DATA.password === "")) {
        DATA.name = input_name_field.value
        DATA.password = input_password_field.value
        const managementURL = baseURL + "messenger/management/"
        sendRequest("POST", managementURL, DATA)
            .then(data => {
                console.log(data)
                if (data.answer_type === "good") {
                    console.log(baseURL + data.main_data.redirect)
                    window.location.href = baseURL + data.main_data.redirect
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
    DATA.name = input_name_field.value
    if (!(input_password_field.value === "" || input_password_repeat_field.value === "") && (input_password_field.value !== input_password_repeat_field.value)) {
        infoLabel.innerText = "Passwords are not matched"
        infoLabel.classList.add("active")
        DATA.password = ""
    } else if ((input_name_field.value !== "") && !(input_password_field.value === "" || input_password_repeat_field.value === "")) {
        infoLabel.classList.remove("active")
        DATA.password = input_password_field.value
    } else {
        infoLabel.innerText = ""
        infoLabel.classList.remove("active")
        DATA.password = input_password_field.value
    }
    if (event.key === "Enter") {
        if (!(DATA.name === "" || DATA.password === "")) {
            sendRegisteredUser()
        }
    }
})