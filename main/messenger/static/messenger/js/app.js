// const URL = "https://jsonplaceholder.typicode.com/users"
//get_all_messages

URL = URL.split('/')
URL = 'http://' + URL[2] + '/messenger'
console.log(URL)
let urls = {
    'messages':URL+'/messages',
    'send_message':URL+'/send_message/'
}

let get_messages_button = document.getElementById('get_messages')
let input_message_field = document.getElementById('message_input')
let log_div = document.getElementById('log__div')
console.dir(log_div)

function getMessages() {
    const URL = urls['messages']
    sendRequest("GET", URL)
        .then(data => {
            console.log(data)
            log_div.innerText = JSON.stringify(data)
        })
        .catch(err => {
            console.log(err)
            log_div.innerText = JSON.stringify(err)
        })
}

function sendMessage() {
    const URL = urls['send_message']
    if (input_message_field.value.length > 0){
        let body = {"message_text":input_message_field.value}
        sendRequest("POST", URL, body)
            .then(data => {
                console.log(data)
                log_div.innerText = JSON.stringify(data)
            })
            .catch(err => {
                console.log(err)
                log_div.innerText = JSON.stringify(err)
            })
        input_message_field.value = ''
    }

}

input_message_field.addEventListener("keyup", function (event){
    if (event.key === "Enter"){
        sendMessage()
    }
})

// const body = {
//     name: "Test",
//     age: 18
// }
//
// sendRequest("POST", URL, body)
//     .then(data => console.log(data))
//     .catch(err => console.log(err))



