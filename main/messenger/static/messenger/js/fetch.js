function sendRequest(method, url, body = null) {
    if (method==='GET'){
        return fetch(url).then(response => {
        if (response.ok) {
            return response.json()
        } else {
            return response.json().then(error => {
                const e = new Error('An error occurred')
                e.data = error
                throw e
            })
        }
    })
    }
    if (method==='POST'){
        const headers = {
        'Content-Type': 'application/json',
        'X-CSRFToken': CSRF_TOKEN,
    }
        return fetch(url, {
        method: method,
        body: JSON.stringify(body),
        headers: headers,
    }).then(response => {
        if (response.ok) {
            return response.json()
        } else {
            return response.json().then(error => {
                const e = new Error('An error occurred')
                e.data = error
                throw e
            })
        }
    })
    }
}