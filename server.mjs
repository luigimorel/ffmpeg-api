import { createFFmpeg } from "@ffmpeg/ffmpeg"
import cors from 'cors'
import express from 'express'
import multer from "multer"
import PQueue from "p-queue"

const ffmpegInstance = createFFmpeg({ log: true })
let ffmpegLoadingPromise = ffmpegInstance.load()
const requestQueue = new PQueue({ concurrency: 1 })

async function getFFmpeg() {

    if (ffmpegLoadingPromise) {
        await ffmpegLoadingPromise
        ffmpegLoadingPromise = undefined
    }

    return ffmpegInstance
}


const app = express()
const port = 3000

app.use(cors())

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }
})

// Endpoint
app.post("/thumbnail", upload.single('video'), async (req, res) => {
    try {
        const videoData = req.file.buffer
        const ffmpeg = await getFFmpeg()

        const inputFileName = `input-video`
        const outputFileName = `output-image.png`
        let outputData = null

        await requestQueue.add(async () => {
            ffmpeg.FS('writeFile', inputFileName, videoData)

            await ffmpeg.run(
                "-ss", "00:00:01.000",
                '-i', inputFileName,
                '-frames:v', '1',
                outputFileName)

            // Free up memory
            outputData = ffmpeg.FS("readFile", outputFileName)
            ffmpeg.FS("unlink", inputFileName)
            ffmpeg.FS("unlink", outputFileName)
        })

        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Disposition': `attachment;filename=${outputFileName}`,
            'Content-Length': outputData.length
        })
        res.end(Buffer.from(outputData, 'binary'))
    } catch (error) {
        console.error(error)
        res.sendStatus(500)
    }

})

app.listen(port, () => {
    console.log(`Info: Server has been started on port ${port} \nPress CTRL + C to stop.`)
})
