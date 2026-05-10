import React, { useRef, useState } from "react";
import { X, Check, Download, Share2, Facebook, Twitter, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toPng } from "html-to-image";
import { SHARE_CARD_STYLES } from "./shareStyles";

interface ShareImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  title: string;
  subtitle: string;
  type: "ayah" | "hadith" | "dua" | "azkar";
  language: "ar" | "en" | "fr";
}

export function ShareImageModal({
  isOpen,
  onClose,
  text,
  title,
  subtitle,
  type,
  language,
}: ShareImageModalProps) {
  const [selectedCardStyle, setSelectedCardStyle] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const getBadgeText = () => {
    switch (type) {
      case "ayah":
        return language === "ar" ? "آية قرآنية" : "Quranic Ayah";
      case "hadith":
        return language === "ar" ? "حديث شريف" : "Hadith Sharif";
      case "dua":
        return language === "ar" ? "دعاء" : "Supplication (Dua)";
      case "azkar":
        return language === "ar" ? "ذكر" : "Remembrance (Dhikr)";
    }
  };

  const downloadShareCard = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
      });
      const link = document.createElement("a");
      link.download = `${type}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  const shareToSocial = (platform: "whatsapp" | "twitter" | "facebook") => {
    const fullText = `${getBadgeText()}:\n\n${text}\n\n${title}${subtitle ? ` - ${subtitle}` : ""}\n\n— Shared from Muslim App`;
    const encodedText = encodeURIComponent(fullText);
    
    let url = "";
    if (platform === "whatsapp") {
      url = `https://wa.me/?text=${encodedText}`;
    } else if (platform === "twitter") {
      url = `https://twitter.com/intent/tweet?text=${encodedText}`;
    } else if (platform === "facebook") {
      // Facebook share dialog primarily uses URLs, but adding text works in some contexts.
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodedText}`;
    }
    
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md z-10 flex flex-col items-center"
          >
            {/* Card to capture */}
            <div
              ref={cardRef}
              className={`w-full aspect-[4/5] ${SHARE_CARD_STYLES[selectedCardStyle].bg} rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden border ${SHARE_CARD_STYLES[selectedCardStyle].border} shadow-2xl transition-colors duration-500`}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(${SHARE_CARD_STYLES[selectedCardStyle].patternColor} 1px, transparent 1px)`,
                  backgroundSize: "20px 20px",
                }}
              ></div>
              <div
                className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] opacity-20"
                style={{ backgroundColor: SHARE_CARD_STYLES[selectedCardStyle].glowColor }}
              ></div>
              <div
                className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[100px] opacity-20"
                style={{ backgroundColor: SHARE_CARD_STYLES[selectedCardStyle].glowColor }}
              ></div>

              <div className={`mt-2 mb-6 ${SHARE_CARD_STYLES[selectedCardStyle].brand} opacity-60 text-[10px] sm:text-xs font-bold px-4 py-1 rounded-full border ${SHARE_CARD_STYLES[selectedCardStyle].titleBorder}`}>
                {getBadgeText()}
              </div>

              <h3 className={`${SHARE_CARD_STYLES[selectedCardStyle].title} font-amiri text-xl sm:text-2xl mb-8 relative z-10 border-b ${SHARE_CARD_STYLES[selectedCardStyle].titleBorder} pb-2 px-8 text-center`}>
                {title}
              </h3>

              <div className="flex-1 flex items-center justify-center relative z-10 w-full">
                <p className={`text-center font-amiri-quran ${SHARE_CARD_STYLES[selectedCardStyle].text} leading-[1.8] text-xl sm:text-2xl drop-shadow-sm`}>
                  {text}
                  {subtitle && <span className="block mt-4 text-sm opacity-80 font-cairo">({subtitle})</span>}
                </p>
              </div>

              <div className="mt-8 relative z-10 flex flex-col items-center gap-1 opacity-70">
                <span className={`${SHARE_CARD_STYLES[selectedCardStyle].brand} text-xs font-sans tracking-widest uppercase`}>
                  Muslim App
                </span>
                <span className={`${SHARE_CARD_STYLES[selectedCardStyle].brand} text-[9px] mt-1 opacity-50`}>
                  {language === "ar" ? "شارك تؤجر" : "Share and be rewarded"}
                </span>
              </div>
            </div>

            {/* Style selector */}
            <div className="flex items-center justify-center gap-3 mt-6 mb-2 overflow-x-auto w-full max-w-sm px-2 pb-2 scrollbar-hide">
              {SHARE_CARD_STYLES.map((style, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCardStyle(idx)}
                  className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center border-2 transition-transform ${selectedCardStyle === idx ? 'scale-110 border-white' : 'border-transparent opacity-60 hover:opacity-100'} ${style.bg}`}
                  title={style.label}
                >
                  {selectedCardStyle === idx && <Check size={16} className={idx === 0 || idx === 6 || idx === 7 ? "text-white" : "text-black"} />}
                </button>
              ))}
            </div>

            {/* Social Actions */}
            <div className="flex items-center gap-4 mt-2 mb-4">
              <button
                onClick={() => shareToSocial("whatsapp")}
                className="bg-[#25D366] text-white p-3 rounded-full hover:scale-105 transition shadow-lg flex items-center justify-center"
                title="Share to WhatsApp"
              >
                <MessageCircle size={20} />
              </button>
              <button
                onClick={() => shareToSocial("twitter")}
                className="bg-[#1DA1F2] text-white p-3 rounded-full hover:scale-105 transition shadow-lg flex items-center justify-center"
                title="Share to Twitter"
              >
                <Twitter size={20} />
              </button>
              <button
                onClick={() => shareToSocial("facebook")}
                className="bg-[#1877F2] text-white p-3 rounded-full hover:scale-105 transition shadow-lg flex items-center justify-center"
                title="Share to Facebook"
              >
                <Facebook size={20} />
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={downloadShareCard}
                className="bg-gold text-dark px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition"
              >
                <Download size={20} />
                {language === "ar" ? "حفظ الصورة" : "Save Image"}
              </button>
              <button
                onClick={onClose}
                className="bg-dark text-white border border-gray-700 px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition"
              >
                {language === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
