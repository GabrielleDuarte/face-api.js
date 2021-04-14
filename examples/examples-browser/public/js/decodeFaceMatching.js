let interval = 2000

let isStop = false
let faceMatcher = null
let currImageIdx = 2, currClassIdx = 0
let to = null

function onSlower() {
    interval = Math.min(interval + 100, 2000)
    $('#interval').val(interval)
}

function onFaster() {
    interval = Math.max(interval - 100, 0)
    $('#interval').val(interval)
}

function onToggleStop() {
    clearTimeout(to)
    isStop = !isStop
    document.getElementById('stop').innerHTML = isStop ? 'Continue' : 'Stop'
    setStatusText(isStop ? 'stopped' : 'running face recognition:')
    if (!isStop) {
    runFaceRecognition()
    }
}

function setStatusText(text) {
    $('#status').val(text)
}

function displayTimeStats(timeInMs) {
    $('#time').val(`${timeInMs} ms`)
    $('#fps').val(`${faceapi.utils.round(1000 / timeInMs)}`)
}

function displayImage(src) {
    getImg().src = src
}

async function runFaceRecognition() {
    async function next() {
    const input = await faceapi.fetchImage(getFaceImageUri(classes[currClassIdx], currImageIdx))
    const imgEl = $('#face').get(0)
    imgEl.src = input.src

    const ts = Date.now()
    const descriptor = await faceapi.computeFaceDescriptor(input)
    displayTimeStats(Date.now() - ts)

    const bestMatch = faceMatcher.findBestMatch(descriptor)
    $('#prediction').val(bestMatch.toString())

    currImageIdx = currClassIdx === (classes.length - 1)
        ? currImageIdx + 1
        : currImageIdx
    currClassIdx = (currClassIdx + 1) % classes.length

    currImageIdx = (currImageIdx % 6) || 2
    to = setTimeout(next, interval)
    }
    await next(0, 0)
}
async function run() {

    try {
        setStatusText('loading model file...')

        await faceapi.loadFaceRecognitionModel('/')

        setStatusText('computing initial descriptors...')

        faceMatcher = await createBbtFaceMatcher(1)
        $('#loader').hide()

        runFaceRecognition()
    } catch (err) {
        console.error(err)
    }
    }




