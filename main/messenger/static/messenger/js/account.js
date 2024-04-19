let baseURL = window.location.protocol + "//" + window.location.host + "/"
console.log(baseURL)
let input_name_field = document.getElementById('input_name')
let infoText = document.getElementById('infoText')
console.dir(input_name_field)
console.dir(infoText)
DATA ={
    name: "",
}
function DataCheck() {
    if (input_name_field.value === ""){
        DATA.name=""
        infoText.textContent = "Account Name can not be empty"
    } else {
        DATA.name=input_name_field.value
        infoText.textContent = "Account"
    }
    setTimeout(DataCheck, 100)
}

DataCheck()

function sendName() {
    const SaveNameURL = baseURL + "messenger/account/save"
    sendRequest("POST", SaveNameURL, DATA)
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
function saveAcc(){
    sendName()
}

function changePassRedirect(){
    window.location.href = baseURL + "messenger/account/password/"
}
