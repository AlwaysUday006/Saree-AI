import { useEffect, useRef } from "react";
import { Pose, Results } from "@mediapipe/pose";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { POSE_CONNECTIONS } from "@mediapipe/pose";

interface PoseOverlayProps {
  imageSrc: string;
  onLandmarksDetected?: (landmarks: any) => void;
}

export default function PoseOverlay({ imageSrc, onLandmarksDetected }: PoseOverlayProps) {
  const poseRef = useRef<Pose | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;

    if (!poseRef.current) {
      poseRef.current = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      poseRef.current.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      poseRef.current.onResults((results: Results) => {
        isProcessingRef.current = false;
        if (!canvasRef.current) return;
        const canvasCtx = canvasRef.current.getContext("2d");
        if (!canvasCtx) return;

        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        if (results.poseLandmarks) {
          drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: "#8b5cf6",
            lineWidth: 2,
          });
          drawLandmarks(canvasCtx, results.poseLandmarks, {
            color: "#ec4899",
            lineWidth: 1,
            radius: 3,
          });
          
          if (onLandmarksDetected) {
            onLandmarksDetected(results.poseLandmarks);
          }
        }
        canvasCtx.restore();
      });
    }

    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      if (canvasRef.current && poseRef.current && !isProcessingRef.current) {
        canvasRef.current.width = img.width;
        canvasRef.current.height = img.height;
        try {
          isProcessingRef.current = true;
          await poseRef.current.send({ image: img });
        } catch (e) {
          console.error("Pose detection error:", e);
          isProcessingRef.current = false;
        }
      }
    };

    return () => {
      // We don't close it here to avoid the "Aborted" error on re-renders
      // Instead we close it when the component truly unmounts if needed
      // Or just let it be if it's a singleton
    };
  }, [imageSrc, onLandmarksDetected]);

  useEffect(() => {
    return () => {
      if (poseRef.current) {
        poseRef.current.close();
        poseRef.current = null;
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
    />
  );
}
