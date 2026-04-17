import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { 
  Upload, 
  User, 
  Shirt, 
  Sparkles, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Camera,
  ChevronRight,
  ChevronLeft,
  Info,
  Image as ImageIcon,
  Activity,
  Gem,
  MapPin,
  MessageCircle,
  X,
  Send,
  Bot
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { cn } from "@/src/lib/utils";
import ReactMarkdown from "react-markdown";
import PoseOverlay from "./components/PoseOverlay";

type Step = "upload" | "detect" | "result";

export default function App() {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [sareeImage, setSareeImage] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<any>(null);
  const [selectedBackground, setSelectedBackground] = useState("Original");
  const [selectedAction, setSelectedAction] = useState("Original Pose");
  const [selectedBlouse, setSelectedBlouse] = useState("Matching Blouse");
  const [selectedJewelry, setSelectedJewelry] = useState("None");
  const [selectedStateStyle, setSelectedStateStyle] = useState("Standard Nivi");
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [runtimeConfig, setRuntimeConfig] = useState<{ API_KEY?: string; GEMINI_API_KEY?: string } | null>(null);

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: "Hi! I'm your AI Stylist. Tell me your skin tone (e.g., fair, wheatish, olive, dusky) and I'll recommend the perfect saree colors for you!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/config");
        if (res.ok) {
          const config = await res.json();
          setRuntimeConfig(config);
          setHasApiKey(!!config.API_KEY);
        }
      } catch (err) {
        console.error("Failed to fetch runtime config:", err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const checkKey = async () => {
      const win = window as any;
      if (win.aistudio?.hasSelectedApiKey) {
        const has = await win.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        setHasApiKey(true); // Fallback for local dev if window.aistudio is missing
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    const win = window as any;
    if (win.aistudio?.openSelectKey) {
      await win.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const apiKey = runtimeConfig?.API_KEY || runtimeConfig?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error("API key is not configured.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const history = chatMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { 
            role: "user", 
            parts: [{ text: "You are an expert Indian fashion stylist. Recommend saree colors, fabrics, and styles based on the user's skin tone. Provide highly accurate, extremely concise, and clean information. Use short bullet points. Do not use conversational filler, fluff, or markdown headers. Just give the direct recommendations using bold text for emphasis." }]
          },
          { 
            role: "model", 
            parts: [{ text: "Understood. I am ready to help!" }]
          },
          ...history,
          { 
            role: "user", 
            parts: [{ text: userMsg }]
          }
        ]
      });

      if (response.text) {
        setChatMessages(prev => [...prev, { role: 'model', text: response.text }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const backgrounds = [
    { name: "Original", icon: <ImageIcon size={14} /> },
    { name: "Royal Palace", icon: <ImageIcon size={14} /> },
    { name: "Lush Garden", icon: <ImageIcon size={14} /> },
    { name: "Modern Studio", icon: <ImageIcon size={14} /> },
    { name: "Temple Courtyard", icon: <ImageIcon size={14} /> },
  ];

  const actions = [
    { name: "Original Pose", icon: <User size={14} /> },
    { name: "Elegant Walk", icon: <Activity size={14} /> },
    { name: "Graceful Namaste", icon: <Activity size={14} /> },
    { name: "Side Profile", icon: <Activity size={14} /> },
  ];

  const blouseDesigns = [
    { name: "Matching Blouse", icon: <Shirt size={14} /> },
    { name: "Sleeveless", icon: <Shirt size={14} /> },
    { name: "Full Sleeve", icon: <Shirt size={14} /> },
    { name: "High Neck", icon: <Shirt size={14} /> },
    { name: "Backless", icon: <Shirt size={14} /> },
    { name: "V-Neck", icon: <Shirt size={14} /> },
  ];

  const jewelryOptions = [
    { name: "None", icon: <Gem size={14} /> },
    { name: "Traditional Gold", icon: <Gem size={14} /> },
    { name: "Elegant Diamond", icon: <Gem size={14} /> },
    { name: "Kundan Set", icon: <Gem size={14} /> },
    { name: "Oxidized Silver", icon: <Gem size={14} /> },
    { name: "Pearl Set", icon: <Gem size={14} /> },
  ];

  const stateStyles = [
    { name: "Standard Nivi", icon: <MapPin size={14} /> },
    { name: "Bengali (Athpourey)", icon: <MapPin size={14} /> },
    { name: "Maharashtrian (Nauvari)", icon: <MapPin size={14} /> },
    { name: "Gujarati (Seedha Pallu)", icon: <MapPin size={14} /> },
    { name: "Kerala (Mundum Neriyathum)", icon: <MapPin size={14} /> },
    { name: "Tamil (Madisar)", icon: <MapPin size={14} /> },
  ];

  const onDropPerson = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPersonImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const onDropSaree = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setSareeImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps: getPersonProps, getInputProps: getPersonInput, isDragActive: isPersonDrag } = useDropzone({
    onDrop: onDropPerson,
    accept: { "image/*": [] },
    multiple: false
  } as any);

  const { getRootProps: getSareeProps, getInputProps: getSareeInput, isDragActive: isSareeDrag } = useDropzone({
    onDrop: onDropSaree,
    accept: { "image/*": [] },
    multiple: false
  } as any);

  const handleTryOn = async () => {
    if (!personImage || !sareeImage) return;
    
    setIsProcessing(true);
    setError(null);
    setStep("result");

    try {
      // Use the injected API_KEY if available (from the selection dialog)
      // otherwise fallback to GEMINI_API_KEY
      const apiKey = runtimeConfig?.API_KEY || runtimeConfig?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error("API key is not configured. Please select an API key or check your environment variables.");
      }

      console.log("Using API key starting with:", apiKey.substring(0, 8) + "...");

      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-2.5-flash-image"; 
      
      const personBase64 = personImage.split(",")[1];
      const sareeBase64 = sareeImage.split(",")[1];

      if (!personBase64 || !sareeBase64) {
        throw new Error("Invalid image data. Please try uploading your photos again.");
      }

      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                data: personBase64,
                mimeType: "image/png",
              },
            },
            {
              inlineData: {
                data: sareeBase64,
                mimeType: "image/png",
              },
            },
            {
              text: `Full body portrait. Perform a realistic virtual saree try-on. 
              Take the person in the first image and dress them in the saree shown in the second image. 
              CRITICAL: The person's face MUST be 100% identical and pixel-perfect to the original photo. 
              Maintain every single facial feature—eyes, nose, mouth, jawline, and skin texture—exactly as they appear in the first image. 
              Do NOT modify, beautify, or regenerate the face in any way. The identity must be perfectly preserved and recognizable.
              
              INSTRUCTIONS:
              1. KEEP THE FACE AS-IS: The person's face MUST be 100% identical and pixel-perfect to the original photo. Do NOT modify, beautify, or regenerate the face in any way. Every single facial feature—eyes, nose, mouth, jawline, and skin texture—must remain exactly as they appear in the uploaded image.
              2. DO NOT CROP THE FACE: Ensure the full head and face are completely visible and not cut off in the final image. The person should be centered in the frame with enough space (headroom) above the head.
              3. Dress the person in the specific saree from the second image.
              4. Draping Style: Drape the saree in the authentic ${selectedStateStyle} style.
              5. Add a ${selectedBlouse === "Matching Blouse" ? "perfectly matching" : selectedBlouse} saree upper wear (blouse/choli) that complements the saree's design, color, and fabric.
              6. ${selectedJewelry !== "None" ? `Add ${selectedJewelry} jewelry (necklace, earrings, bangles) that beautifully complements the saree ensemble.` : "Do not add any additional jewelry."}
              7. Ensure both the saree and the upper wear are draped realistically according to the person's pose and body shape.
              8. ${selectedAction !== "Original Pose" ? `Change the person's pose to a ${selectedAction}.` : "Maintain the person's original pose."}
              9. ${selectedBackground !== "Original" ? `Change the background to a ${selectedBackground}.` : "Maintain the original background."}
              
              Provide only the final image of the person wearing the complete saree ensemble (saree draped in ${selectedStateStyle} style, ${selectedBlouse}, and ${selectedJewelry} jewelry), with the face perfectly preserved, fully visible, and not cropped.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4"
          }
        }
      });

      if (!response.candidates || response.candidates.length === 0 || !response.candidates[0].content || !response.candidates[0].content.parts) {
        throw new Error("The AI didn't return any results. This might be due to safety filters or a temporary service issue.");
      }

      let foundImage = false;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setResultImage(`data:image/png;base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        console.error("No image part found in response:", response);
        throw new Error("The AI didn't generate an image. This might be due to safety filters or unclear photos. Please try again with different images.");
      }
    } catch (err: any) {
      console.error("Try-on error details:", err);
      let errorMessage = "An error occurred during the AI try-on process.";
      
      // Try to extract the most useful error message
      let errStr = "";
      if (typeof err === 'string') {
        errStr = err;
      } else if (err.message) {
        errStr = err.message;
      } else {
        try {
          errStr = JSON.stringify(err);
        } catch (e) {
          errStr = String(err);
        }
      }

      const isQuotaError = errStr.toLowerCase().includes("quota") || 
                           errStr.includes("429") || 
                           errStr.includes("RESOURCE_EXHAUSTED") ||
                           (err.error && err.error.code === 429) ||
                           (err.status === 429);

      if (errStr.includes("API key not valid")) {
        errorMessage = "API key is invalid. Please check your settings.";
      } else if (errStr.toLowerCase().includes("safety")) {
        errorMessage = "The images were flagged by safety filters. Please use appropriate photos.";
      } else if (isQuotaError) {
        errorMessage = "API quota exceeded. Please click 'Setup API Key' in the header to use your own key and continue.";
      } else {
        // If it's a complex object, try to find the message property
        if (err.error && err.error.message) {
          errorMessage = err.error.message;
        } else {
          errorMessage = err.message || errorMessage;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setPersonImage(null);
    setSareeImage(null);
    setResultImage(null);
    setStep("upload");
    setError(null);
    setSelectedBackground("Original");
    setSelectedAction("Original Pose");
    setSelectedBlouse("Matching Blouse");
    setSelectedJewelry("None");
    setSelectedStateStyle("Standard Nivi");
  };

  const downloadResult = () => {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = "saree-tryon-result.png";
    link.click();
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center sm:p-6 md:p-12">
      <div className="w-full max-w-[420px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden sm:rounded-[40px] sm:h-[850px] sm:shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col border-x-0 sm:border-x sm:border-y border-white/10">
        
        {/* Decorative blobs for dark glassmorphism */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] rounded-full bg-purple-600/20 blur-[80px] animate-blob"></div>
          <div className="absolute top-[40%] right-[-20%] w-[70%] h-[50%] rounded-full bg-indigo-600/20 blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-10%] left-[10%] w-[60%] h-[40%] rounded-full bg-teal-600/20 blur-[80px] animate-blob animation-delay-4000"></div>
        </div>

        {/* Mobile Header */}
        <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 py-4 px-6 sticky top-0 z-20 shadow-sm flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <Sparkles size={16} />
              </div>
              <h1 className="text-xl font-bold serif text-white tracking-tight">Saree AI</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {hasApiKey === false && (
                <button 
                  onClick={handleOpenKeyDialog}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <Gem size={12} />
                  Setup Key
                </button>
              )}
              {hasApiKey === true && (
                <button 
                  onClick={handleOpenKeyDialog}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md rounded-full transition-all flex items-center justify-center shadow-sm"
                  title="Change API Key"
                >
                  <Gem size={14} />
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 w-full overflow-y-auto p-4 relative z-10 scrollbar-hide">
          <AnimatePresence mode="wait">
            {step === "upload" && (
              <motion.div 
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col gap-8"
              >
                <div className="space-y-6 pb-8">
                  <div className="text-center mb-6 mt-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/10 text-neutral-300 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 backdrop-blur-md shadow-sm">
                      <Sparkles size={10} />
                      Virtual Studio
                    </div>
                    <h2 className="text-3xl font-bold serif mb-3 text-white leading-tight">
                      Drape Elegance <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Instantly.</span>
                    </h2>
                    <p className="text-sm text-neutral-400 leading-relaxed px-2">
                      Upload your photo and a saree. Our AI will seamlessly drape it onto you.
                    </p>
                  </div>

                  <div className="flex flex-col gap-6">
                    {/* Options Sidebar (Now Top/Stacked) */}
                    <div className="space-y-4">
                      <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-white/10 space-y-6">
                        <h3 className="text-lg font-bold serif text-white flex items-center gap-2">
                          <Sparkles size={16} className="text-primary" />
                          Style Options
                        </h3>
                      <div className="space-y-6 pt-4">
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                      <ImageIcon size={12} />
                      Aesthetic Background
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {backgrounds.map((bg) => (
                        <button
                          key={bg.name}
                          onClick={() => setSelectedBackground(bg.name)}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border backdrop-blur-md",
                            selectedBackground === bg.name 
                              ? "bg-primary/90 text-white border-primary/50 shadow-lg shadow-primary/20" 
                              : "bg-white/40 text-neutral-700 border-white/50 hover:bg-white/60 hover:border-white/70 shadow-sm"
                          )}
                        >
                          {bg.icon}
                          {bg.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                      <Activity size={12} />
                      Pose & Action
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <button
                          key={action.name}
                          onClick={() => setSelectedAction(action.name)}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border backdrop-blur-md",
                            selectedAction === action.name 
                              ? "bg-secondary/90 text-white border-secondary/50 shadow-lg shadow-secondary/20" 
                              : "bg-white/40 text-neutral-700 border-white/50 hover:bg-white/60 hover:border-white/70 shadow-sm"
                          )}
                        >
                          {action.icon}
                          {action.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                      <Shirt size={12} />
                      Blouse Design
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {blouseDesigns.map((blouse) => (
                        <button
                          key={blouse.name}
                          onClick={() => setSelectedBlouse(blouse.name)}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border backdrop-blur-md",
                            selectedBlouse === blouse.name 
                              ? "bg-neutral-800/90 text-white border-neutral-700 shadow-lg shadow-neutral-800/20" 
                              : "bg-white/40 text-neutral-700 border-white/50 hover:bg-white/60 hover:border-white/70 shadow-sm"
                          )}
                        >
                          {blouse.icon}
                          {blouse.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                      <MapPin size={12} />
                      Regional Draping Style
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {stateStyles.map((style) => (
                        <button
                          key={style.name}
                          onClick={() => setSelectedStateStyle(style.name)}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border backdrop-blur-md",
                            selectedStateStyle === style.name 
                              ? "bg-teal-600/90 text-white border-teal-500 shadow-lg shadow-teal-600/20" 
                              : "bg-white/40 text-neutral-700 border-white/50 hover:bg-white/60 hover:border-white/70 shadow-sm"
                          )}
                        >
                          {style.icon}
                          {style.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                      <Gem size={12} />
                      Jewelry Style
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {jewelryOptions.map((jewelry) => (
                        <button
                          key={jewelry.name}
                          onClick={() => setSelectedJewelry(jewelry.name)}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 border backdrop-blur-md",
                            selectedJewelry === jewelry.name 
                              ? "bg-amber-600/90 text-white border-amber-500 shadow-lg shadow-amber-600/20" 
                              : "bg-white/40 text-neutral-700 border-white/50 hover:bg-white/60 hover:border-white/70 shadow-sm"
                          )}
                        >
                          {jewelry.icon}
                          {jewelry.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {personImage && sareeImage && (
                  <button
                    onClick={handleTryOn}
                    className="w-full py-5 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-3 group"
                  >
                    Start Virtual Try-On
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Person Upload */}
                <div className="space-y-4">
                  <label className="text-sm font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                    <User size={14} />
                    Your Photo
                  </label>
                  <div 
                    {...getPersonProps()} 
                    className={cn(
                      "aspect-[3/4] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all cursor-pointer overflow-hidden relative backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]",
                      isPersonDrag ? "border-primary bg-primary/10" : "border-white/60 hover:border-primary/50 bg-white/40",
                      personImage && "border-none shadow-none"
                    )}
                  >
                    <input {...getPersonInput()} />
                    {personImage ? (
                      <>
                        <img src={personImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <PoseOverlay imageSrc={personImage} onLandmarksDetected={setLandmarks} />
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center text-neutral-500 mb-4 shadow-sm">
                          <Camera size={32} />
                        </div>
                        <p className="text-sm font-medium text-neutral-700 text-center">Drag & drop or click to upload your photo</p>
                        <p className="text-xs text-neutral-500 mt-2">Full body works best</p>
                      </>
                    )}
                    {personImage && (
                      <div className="absolute top-4 right-4 bg-white/60 backdrop-blur-md border border-white/50 p-2 rounded-full shadow-lg">
                        <RefreshCw size={16} className="text-neutral-700" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Saree Upload */}
                <div className="space-y-4">
                  <label className="text-sm font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                    <Shirt size={14} />
                    Saree Photo
                  </label>
                  <div 
                    {...getSareeProps()} 
                    className={cn(
                      "aspect-[3/4] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all cursor-pointer overflow-hidden relative backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]",
                      isSareeDrag ? "border-secondary bg-secondary/10" : "border-white/60 hover:border-secondary/50 bg-white/40",
                      sareeImage && "border-none shadow-none"
                    )}
                  >
                    <input {...getSareeInput()} />
                    {sareeImage ? (
                      <img src={sareeImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl flex items-center justify-center text-neutral-500 mb-4 shadow-sm">
                          <Shirt size={32} />
                        </div>
                        <p className="text-sm font-medium text-neutral-700 text-center">Drag & drop or click to upload saree photo</p>
                        <p className="text-xs text-neutral-500 mt-2">Clear fabric view works best</p>
                      </>
                    )}
                    {sareeImage && (
                      <div className="absolute top-4 right-4 bg-white/60 backdrop-blur-md border border-white/50 p-2 rounded-full shadow-lg">
                        <RefreshCw size={16} className="text-neutral-700" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

            {/* How it works section */}
            <section className="py-12 border-t border-white/40 relative z-10">
              <div className="flex items-center gap-3 mb-12">
                <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center text-white shadow-lg">
                  <Info size={18} />
                </div>
                <h3 className="text-2xl font-bold serif text-neutral-800">How Saree Draping Works</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    title: "1. Pose Detection",
                    desc: "MediaPipe AI analyzes your photo to detect body landmarks like shoulders, waist, and legs for perfect alignment.",
                    icon: <Camera className="text-primary" />
                  },
                  {
                    title: "2. Fabric Analysis",
                    desc: "Our vision model extracts the texture, pattern, and color of the saree fabric to ensure high-fidelity results.",
                    icon: <Shirt className="text-secondary" />
                  },
                  {
                    title: "3. Generative Draping",
                    desc: "Gemini 2.5 Flash realistically drapes the saree over your body, adjusting for perspective and lighting.",
                    icon: <Sparkles className="text-accent" />
                  }
                ].map((item, i) => (
                  <div key={i} className="p-8 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:bg-white/50 transition-all">
                    <div className="w-12 h-12 bg-white/60 backdrop-blur-md border border-white/50 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                      {item.icon}
                    </div>
                    <h4 className="text-lg font-bold mb-3 text-neutral-800">{item.title}</h4>
                    <p className="text-sm text-neutral-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
          )}

          {step === "result" && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col h-full min-h-[600px]"
            >
              <div className="bg-white/5 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden border border-white/10 flex flex-col flex-1">
                <div className="aspect-[3/4] bg-black/20 relative w-full flex-shrink-0">
                  {isProcessing ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                      <h3 className="text-xl font-bold serif mb-2 text-white">AI is Draping...</h3>
                      <p className="text-xs text-neutral-400">Analyzing pose and adjusting fabric for a perfect fit. This takes about 10-15 seconds.</p>
                      
                      <div className="mt-8 space-y-2 w-full max-w-[200px]">
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 15, ease: "linear" }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-neutral-500">
                          <span>Processing</span>
                          <span>Finalizing</span>
                        </div>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                      <AlertCircle size={40} className="mb-4 text-red-400" />
                      <h3 className="text-lg font-bold mb-2 text-red-400">Try-On Failed</h3>
                      <p className="text-sm text-neutral-300 mb-6">{error}</p>
                      
                      <div className="flex flex-col gap-3 w-full max-w-[200px]">
                        {error.includes("quota") && (
                          <button 
                            onClick={handleOpenKeyDialog}
                            className="px-4 py-2 bg-amber-500/90 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 backdrop-blur-md"
                          >
                            <Gem size={14} />
                            Setup API Key
                          </button>
                        )}
                        <button 
                          onClick={() => setStep("upload")}
                          className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-xl text-sm font-bold hover:bg-white/20 transition-colors backdrop-blur-md shadow-sm"
                        >
                          Go Back
                        </button>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={resultImage!} 
                      className="w-full h-full object-cover" 
                      alt="Try-on result" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                <div className="p-5 flex flex-col justify-between bg-white/5 backdrop-blur-md flex-1">
                  <div>
                    <div className="flex items-center gap-2 text-primary mb-3">
                      <Sparkles size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-300">AI Generated Result</span>
                    </div>
                    <h2 className="text-2xl font-bold serif mb-3 leading-tight text-white">Your Virtual Look is Ready.</h2>
                    
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-sm">
                        <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Model</p>
                        <p className="text-xs font-semibold text-neutral-200">Gemini 2.5 Flash</p>
                      </div>
                      <div className="p-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-sm">
                        <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Status</p>
                        <p className="text-xs font-semibold text-green-400">Completed</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-auto">
                    <button 
                      disabled={isProcessing}
                      onClick={downloadResult}
                      className="w-full py-3 bg-white hover:bg-neutral-200 text-black rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg backdrop-blur-md"
                    >
                      <Download size={16} />
                      Download Image
                    </button>
                    <button 
                      disabled={isProcessing}
                      onClick={reset}
                      className="w-full py-3 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm backdrop-blur-md"
                    >
                      <RefreshCw size={16} />
                      Try Another Saree
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chatbot UI */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="mb-4 w-[350px] h-[500px] max-h-[80vh] max-w-[calc(100vw-3rem)] bg-neutral-900/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
              >
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                      <Bot size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">AI Stylist</h3>
                      <p className="text-[10px] text-neutral-400">Color & Style Expert</p>
                    </div>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="text-neutral-400 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-white/10 text-neutral-200 rounded-tl-sm border border-white/5'}`}>
                        {msg.role === 'model' ? (
                          <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-transparent prose-pre:p-0">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.text
                        )}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] p-4 rounded-2xl bg-white/10 text-neutral-200 rounded-tl-sm border border-white/5 flex gap-1">
                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-white/5 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="E.g., I have a wheatish skin tone..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <button 
                    type="submit"
                    disabled={!chatInput.trim() || isChatLoading}
                    className="w-10 h-10 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary text-white rounded-xl flex items-center justify-center transition-colors shadow-lg"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-transform hover:scale-105 active:scale-95"
          >
            {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
          </button>
        </div>
      </main>
      </div>
    </div>
  );
}
