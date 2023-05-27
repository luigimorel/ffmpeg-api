const endPoint = "http://localhost:3000/thumbnail"

const fileInput = document.querySelector("#file")
const submitButton = document.querySelector("#submit")
const thumbnailPreview = document.querySelector("#thumbnail")
const errorDiv = document.querySelector("#error")


submitButton.addEventListener('click', async () => {
    const { files } = fileInput;

    if (files.length > 0) {
        const file = files[0]
        try {
            const thumbNail = await createThumbnail(file)
            thumbnailPreview.src = thumbNail
        } catch (error) {
            showError(error)
        }
    } else {
        showError("Please select a file")
    }

})

function showError(msg) {
    errorDiv.innerText = `Error: ${msg}`
}

// Convert blob to data URL
async function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(reader.error)
        reader.onabort = () => reject(new Error("Read aborted"))
        reader.readAsDataURL(blob)
    })
}

async function createThumbnail(video) {
    const payload = new FormData()
    payload.append('video', video)

    const res = await fetch(endPoint, {
        method: 'POST',
        body: payload
    })

    if (!res.ok) {
        throw new Error('Creating thumbnail failed')
    }

    const thumbNailBlob = await res.blob()
    const thumbNail = await blobToDataURL(thumbNailBlob)

    return thumbNail
}
