const baseURL = window.location.protocol + "//" + window.location.host + "/"
const input_name_field = document.getElementById('login')
const input_password_field = document.getElementById('password')
const infoLabel = document.getElementById('error-popup')


let DATA = {
    request: "login",
    name: "",
    password: "",
}

document.getElementById("registrationRedirect").onclick = ()=>{
    window.location.href = baseURL + "messenger/registration"
}

function DataCheck() {
    if (input_password_field.value === "" || input_name_field.value === "") {
        infoLabel.innerText = "Enter your username and password"
        infoLabel.classList.add("active")
        setTimeout(DataCheck, 1000)
    } else if (!(input_name_field.value === "" || input_password_field.value === "")) {
        infoLabel.classList.remove("active")
    }

}

DataCheck()

function sendLoginUser() {
    infoLabel.classList.remove("active")
    const managementURL = baseURL + "messenger/management/"
    DATA.name = input_name_field.value
    DATA.password = input_password_field.value
    sendRequest("POST", managementURL, DATA)
        .then(data => {
            console.log(data)
            if (data.answer_type === "good") {
                console.log(baseURL + data.main_data.redirect)
                window.location.href = baseURL + data.main_data.redirect
            }else {

                infoLabel.innerHTML = data.comment
                infoLabel.classList.add("active")
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

