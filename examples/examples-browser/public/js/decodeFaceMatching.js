let interval = 2000

let isStop = false
let faceMatcher = null
let currImageIdx = 2, currClassIdx = 0
let to = null
let ageGenderData =null


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
    $('#age').val('-')
    $('#gender').val('-')
    $('#expression').val('-')

    const input = await faceapi.fetchImage(getFaceImageUri(classes[currClassIdx], currImageIdx))
    const imgEl = $('#face').get(0)
    imgEl.src = input.src

    const ts = Date.now()
    const descriptor = await faceapi.computeFaceDescriptor(input)
    displayTimeStats(Date.now() - ts)

    const bestMatch = faceMatcher.findBestMatch(descriptor)
    const detectionsWithAgeAndGender = await faceapi
      .detectAllFaces(input)
      .withFaceLandmarks()
      .withAgeAndGender()
      .withFaceExpressions()

    $('#prediction').val(bestMatch.toString())

    const canvas = $('#overlay').get(0)
    //faceapi.matchDimensions(canvas, imgEl)
    
    const resizedResults = faceapi.resizeResults(detectionsWithAgeAndGender, input)
    const minConfidence = 0.05
    const init = new Date().getMilliseconds()
    const initWholeExection = new Date().getSeconds()
    resizedResults.forEach(detectionWithAgeAndGender => {
        const{ age, gender, genderProbability, expressions} = detectionWithAgeAndGender
        $('#age').val(`${faceapi.utils.round(age,0)} years`)    
        $('#gender').val(`${gender} (${faceapi.utils.round(genderProbability)})`)    
        $('#expression').val(`${JSON.stringify(expressions)}`)

      
      
      const finalTime  = new Date().getMilliseconds() - init
      const ExecutionTillNow  = new Date().getSeconds() + initWholeExection
      axios.post('http://localhost:4101/apirecord/register', {fileName:"", executionPerImage:finalTime.toString(), wholeExecution: ExecutionTillNow, personName: bestMatch.toString(), prediction: bestMatch.toString(), age:faceapi.utils.round(age,0), sex: (`${gender} (${faceapi.utils.round(genderProbability)})`), expression:JSON.stringify(expressions)})
      .then(function (response) {
      // handle success
      console.log(response);
      })
      .catch(function (error) {
      // handle error
      console.log(error);
      })
      console.log(JSON.stringify(expressions))
    })

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

    // load face detection and age and gender recognition models
    // and load face landmark model for face alignment
    await changeFaceDetector(SSD_MOBILENETV1)
    await faceapi.loadFaceLandmarkModel('/')
    await faceapi.nets.ageGenderNet.load('/')
    await faceapi.loadFaceExpressionModel('/')

      setStatusText('computing initial descriptors...')

      faceMatcher = await createBbtFaceMatcher(1)
      $('#loader').hide()

      runFaceRecognition()
    } catch (err) {
      console.error(err)
    }
  }


    