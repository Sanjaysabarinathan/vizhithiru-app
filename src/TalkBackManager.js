import { useEffect, useRef } from 'react';

export default function TalkBackManager() {
  const lastElementRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const voicesRef = useRef([]);

  useEffect(() => {
    const isTalkBackOn = localStorage.getItem("vizhithiru_talkback") === "true";
    if (!isTalkBackOn) return;

    const loadVoices = () => {
      let voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesRef.current = voices;
      }
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    const speak = (text) => {
      window.speechSynthesis.cancel();
      
      const u = new SpeechSynthesisUtterance(text);
      
      // Select best voice
      const preferredVoice = voicesRef.current.find(v => v.name.includes("Google") && v.lang.includes("en")) 
                          || voicesRef.current[0];
      
      if (preferredVoice) u.voice = preferredVoice;
      
      // 🔽 CHANGED SPEED HERE: 0.9 is slower and clearer
      u.rate = 0.9; 
      
      window.speechSynthesis.speak(u);
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      
      const validTags = ['P', 'H1', 'H2', 'H3', 'BUTTON', 'SPAN', 'IMG', 'A', 'LI'];
      const hasText = target.innerText && target.innerText.trim().length > 0;
      
      if (!validTags.includes(target.tagName) && !hasText) return;

      if (lastElementRef.current === target) return;
      lastElementRef.current = target;

      // Visuals
      document.querySelectorAll('.talkback-focus').forEach(el => {
        el.classList.remove('talkback-focus');
        el.style.outline = 'none';
      });
      target.classList.add('talkback-focus');
      target.style.outline = "3px solid #22c55e"; 
      target.style.cursor = "pointer";

      // Audio Debounce
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

      debounceTimerRef.current = setTimeout(() => {
         let textToRead = target.innerText || target.alt || "Item";
         if (textToRead.length > 100) textToRead = "Content"; 
         speak(textToRead);
      }, 50);
    };

    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mouseover', handleMouseOver);
      window.speechSynthesis.cancel();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return null;
}