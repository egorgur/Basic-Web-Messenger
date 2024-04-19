console.dir(document.getElementById('animated-text'))
// document.getElementById('animated-text').textContent = "P"
const animatedText = document.getElementById('animated-text')
const cursor = document.getElementById("cursor")

let i = 0,
    d = 0,
    reverse = false
const text = "rogrammistichi"

function blinkCursor() {
    if (cursor.style["background"] === "none"){
        cursor.style["background"]= ""
    } else {
        cursor.style["background"]= "none"
    }
    setTimeout(blinkCursor, 400)
}

function animateText() {
    if (reverse === false) {
        animatedText.textContent = text.slice(0, i)
        i++
        if (i > 14) {
            i = 14
            reverse = true
            setTimeout(animateText, 2000)
        } else {
            setTimeout(animateText, 800)
        }
    } else {
        animatedText.textContent = text.slice(0, i)
        i--
        if (i < 0) {
            i = 0
            reverse = false
            setTimeout(animateText, 700)
        } else {
            setTimeout(animateText, 300)
        }
    }
}

blinkCursor()
animateText()
