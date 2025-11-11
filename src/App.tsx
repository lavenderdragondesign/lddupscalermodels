import { useEffect, useState, useRef } from "react";

const LOGO_URL = "https://i.postimg.cc/bwK2cRY0/download-20.png";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false); // for fade-out removal
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    // Safety timeout (in case onLoad never fires)
    const t = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!loading) {
      // after we toggle loading false, wait for CSS fade then hide
      const t = setTimeout(() => setHidden(true), 650);
      return () => clearTimeout(t);
    }
  }, [loading]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      {!hidden && (
        <div
          className={`absolute inset-0 z-50 flex flex-col items-center justify-center text-white splash-fade
                      ${loading ? "opacity-100" : "opacity-0"}
                      bg-gradient-to-br from-fuchsia-700 via-purple-700 to-indigo-800`}
        >
          <img
            src={LOGO_URL}
            alt="LavenderDragonDesign logo"
            className="w-24 h-24 rounded-full shadow-2xl mb-6 object-cover"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center drop-shadow">
            Loading LavenderDragonDesign&apos;s Upscaler
          </h1>
          <p className="text-sm md:text-base opacity-80">Web React App</p>

          <div className="mt-6 w-64 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full w-1/3 animate-[loadbar_1.8s_ease-in-out_infinite] bg-white/80"></div>
          </div>

          <style>
            {`@keyframes loadbar {
                0% { transform: translateX(-100%); }
                50% { transform: translateX(50%); }
                100% { transform: translateX(200%); }
              }`}
          </style>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src="https://cappuccino.moe/"
        className="w-full h-full border-0"
        onLoad={() => setLoading(false)}
        title="LavenderDragonDesign Upscaler"
        sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-modals"
      />
    </div>
  );
}
