const fs = require('fs')

function setlog(){
    const content = 'Hello World'

    fs.writeFile('/tmp/test.txt', content, err => {
    if (err) {
        console.error(err)
        return
    }
    //file written successfully
    })
}