function CreateRequest() {
    let Request = false;

    if (window.XMLHttpRequest) {
        //Gecko-совместимые браузеры, Safari, Konqueror
        Request = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
        //Internet explorer
        try {
            Request = new ActiveXObject("Microsoft.XMLHTTP");
        } catch (CatchException) {
            Request = new ActiveXObject("Msxml2.XMLHTTP");
        }
    }

    if (!Request) {
        alert("Невозможно создать XMLHttpRequest");
    }

    return Request;
}

const requestURL = "https://jsonplaceholder.typicode.com/users"

function sendRequest(method, url, body = null) {
    return new Promise((resolve, reject) => {
        const xhr = CreateRequest()
        xhr.open(method, url)
        xhr.responseType = 'json'
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.onload = () => {
            if (xhr.status >= 400) {
                reject(xhr.response)
            } else {
                resolve(xhr.response)
            }
        }
        xhr.onerror = () => {
            reject(xhr.response)
        }
        xhr.send(JSON.stringify(body))
    })
}

// sendRequest("GET", requestURL)
//     .then(data => console.log(data))
//     .catch(err => console.log(err))

const body = {
    name: "Test",
    age: 18
}
sendRequest("POST", requestURL, body)
    .then(data => console.log(data))
    .catch(err => console.log(err))