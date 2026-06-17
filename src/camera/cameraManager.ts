import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'
import { FACE_DETECTION_INTERVAL_MS } from '../constants'
import { updateAppState } from '../state/appState'
import { onFaceAbsent, onFaceDetected } from './facePresence'

let detector: FaceDetector | null = null
let videoEl: HTMLVideoElement | null = null
let intervalId: ReturnType<typeof setInterval> | null = null
let running = false

export async function startCamera(): Promise<void> {
  updateAppState({ cameraStatus: 'pending' })

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 320, height: 240 },
    })
    videoEl = document.createElement('video')
    videoEl.srcObject = stream
    videoEl.autoplay = true
    videoEl.muted = true
    videoEl.playsInline = true
    await videoEl.play()

    const fileset = await FilesetResolver.forVisionTasks(
      import.meta.env.BASE_URL + 'mediapipe-wasm'
    )
    detector = await FaceDetector.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: import.meta.env.BASE_URL + 'face_detector.tflite',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.5,
      minSuppressionThreshold: 0.3,
    })

    updateAppState({ cameraStatus: 'active' })
    running = true
    startDetectionLoop()
  } catch (err) {
    const isDenied =
      err instanceof DOMException &&
      (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
    updateAppState({ cameraStatus: isDenied ? 'denied' : 'error' })
    console.warn('Camera init failed:', err)
  }
}

export function stopCamera(): void {
  running = false
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
  if (videoEl?.srcObject) {
    ;(videoEl.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
    videoEl = null
  }
  detector?.close()
  detector = null
}

function startDetectionLoop(): void {
  if (intervalId !== null) clearInterval(intervalId)
  intervalId = setInterval(detect, FACE_DETECTION_INTERVAL_MS)
}

function detect(): void {
  if (!running || !detector || !videoEl || videoEl.readyState < 2) return
  try {
    const result = detector.detectForVideo(videoEl, performance.now())
    if (result.detections.length > 0) {
      onFaceDetected()
    } else {
      onFaceAbsent()
    }
  } catch {
    onFaceAbsent()
  }
}
