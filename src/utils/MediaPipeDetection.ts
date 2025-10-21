import { FaceLandmarker, HandLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

let faceLandmarker: FaceLandmarker | null = null;
let handLandmarker: HandLandmarker | null = null;

export interface DetectionResult {
  faceDetected: boolean;
  eyeContact: number;
  headPose: {
    yaw: number;
    pitch: number;
  };
  handGestures: string[];
  facialMovement: number;
  engagement: number;
  confidence: number;
}

export const initializeMediaPipe = async () => {
  try {
    console.log('🤖 Initializing MediaPipe models...');
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    // Initialize Face Landmarker
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU'
      },
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
      runningMode: 'VIDEO',
      numFaces: 1
    });

    // Initialize Hand Landmarker
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numHands: 2
    });

    console.log('✅ MediaPipe models initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing MediaPipe:', error);
    return false;
  }
};

export const detectAndDraw = async (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  timestamp: number
): Promise<DetectionResult> => {
  if (!faceLandmarker || !handLandmarker) {
    throw new Error('MediaPipe not initialized');
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas context');

  // Clear canvas and draw video frame
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const drawingUtils = new DrawingUtils(ctx);
  
  let result: DetectionResult = {
    faceDetected: false,
    eyeContact: 0,
    headPose: { yaw: 0, pitch: 0 },
    handGestures: [],
    facialMovement: 0,
    engagement: 0,
    confidence: 0
  };

  try {
    // Detect face landmarks
    const faceResults = faceLandmarker.detectForVideo(video, timestamp);
    
    if (faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
      result.faceDetected = true;
      const landmarks = faceResults.faceLandmarks[0];

      // Draw face mesh with green color
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_TESSELATION,
        { color: '#00FF00', lineWidth: 1 }
      );

      // Draw face contours
      drawingUtils.drawConnectors(
        landmarks,
        FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
        { color: '#00FF00', lineWidth: 2 }
      );

      // Highlight eyes with circles
      const leftEye = landmarks[33]; // Left eye center
      const rightEye = landmarks[263]; // Right eye center
      
      ctx.fillStyle = '#00FF00';
      ctx.beginPath();
      ctx.arc(leftEye.x * canvas.width, leftEye.y * canvas.height, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEye.x * canvas.width, rightEye.y * canvas.height, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Calculate eye contact (based on gaze direction)
      const nose = landmarks[1];
      const leftEyeOuter = landmarks[33];
      const rightEyeOuter = landmarks[263];
      const eyeDistance = Math.abs(rightEyeOuter.x - leftEyeOuter.x);
      const centerOffset = Math.abs(nose.x - (leftEyeOuter.x + rightEyeOuter.x) / 2);
      result.eyeContact = Math.max(0, 100 - (centerOffset / eyeDistance) * 200);

      // Calculate head pose (yaw and pitch)
      result.headPose.yaw = (nose.x - 0.5) * 180; // -90 to +90 degrees
      result.headPose.pitch = (nose.y - 0.5) * 180;

      // Calculate facial movement (head stability)
      const movement = Math.abs(result.headPose.yaw) + Math.abs(result.headPose.pitch);
      result.facialMovement = Math.min(100, movement);

      // Calculate engagement (based on face position and size)
      const faceSize = Math.abs(landmarks[10].y - landmarks[152].y);
      result.engagement = Math.min(100, faceSize * 500); // Normalize to 0-100

      // Calculate confidence (based on posture and gaze)
      result.confidence = Math.max(0, 100 - result.facialMovement * 0.5);

      // Draw bounding box around face
      const minX = Math.min(...landmarks.map(l => l.x)) * canvas.width;
      const maxX = Math.max(...landmarks.map(l => l.x)) * canvas.width;
      const minY = Math.min(...landmarks.map(l => l.y)) * canvas.height;
      const maxY = Math.max(...landmarks.map(l => l.y)) * canvas.height;
      
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 3;
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

      // Add label
      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 16px Arial';
      ctx.fillText('Face Detected', minX, minY - 10);
    }

    // Detect hand landmarks
    const handResults = handLandmarker.detectForVideo(video, timestamp);
    
    if (handResults.landmarks && handResults.landmarks.length > 0) {
      for (let i = 0; i < handResults.landmarks.length; i++) {
        const landmarks = handResults.landmarks[i];
        
        // Draw hand landmarks with cyan color
        drawingUtils.drawConnectors(
          landmarks,
          HandLandmarker.HAND_CONNECTIONS,
          { color: '#00FFFF', lineWidth: 2 }
        );
        
        drawingUtils.drawLandmarks(landmarks, {
          color: '#FF00FF',
          radius: 4
        });

        // Detect gesture type (simplified)
        const thumb = landmarks[4];
        const index = landmarks[8];
        const middle = landmarks[12];
        const ring = landmarks[16];
        const pinky = landmarks[20];
        const wrist = landmarks[0];

        // Calculate if fingers are extended
        const thumbUp = thumb.y < wrist.y;
        const indexUp = index.y < wrist.y;
        const middleUp = middle.y < wrist.y;
        const ringUp = ring.y < wrist.y;
        const pinkyUp = pinky.y < wrist.y;

        let gesture = 'Hand Detected';
        if (indexUp && !middleUp && !ringUp && !pinkyUp) {
          gesture = 'Pointing';
        } else if (indexUp && middleUp && !ringUp && !pinkyUp) {
          gesture = 'Peace Sign';
        } else if (thumbUp && indexUp && middleUp && ringUp && pinkyUp) {
          gesture = 'Open Palm';
        } else if (!indexUp && !middleUp && !ringUp && !pinkyUp) {
          gesture = 'Fist';
        }

        result.handGestures.push(gesture);

        // Draw bounding box around hand
        const minX = Math.min(...landmarks.map(l => l.x)) * canvas.width;
        const maxX = Math.max(...landmarks.map(l => l.x)) * canvas.width;
        const minY = Math.min(...landmarks.map(l => l.y)) * canvas.height;
        const maxY = Math.max(...landmarks.map(l => l.y)) * canvas.height;
        
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

        // Add label
        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(gesture, minX, maxY + 20);
      }
    }

    // Draw detection info overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 250, 120);
    
    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('🎯 Real-time Detection', 20, 30);
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Face: ${result.faceDetected ? '✓ Detected' : '✗ Not Found'}`, 20, 50);
    ctx.fillText(`Eye Contact: ${result.eyeContact.toFixed(0)}%`, 20, 70);
    ctx.fillText(`Engagement: ${result.engagement.toFixed(0)}%`, 20, 90);
    ctx.fillText(`Hands: ${handResults.landmarks?.length || 0} detected`, 20, 110);

  } catch (error) {
    console.error('Detection error:', error);
  }

  return result;
};

export const cleanup = () => {
  if (faceLandmarker) {
    faceLandmarker.close();
    faceLandmarker = null;
  }
  if (handLandmarker) {
    handLandmarker.close();
    handLandmarker = null;
  }
};
