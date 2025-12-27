let talkbackEnabled = false;

export const enableTalkBackGlobally = () => {
  if (talkbackEnabled) return;  // prevent re-attaching listeners
  talkbackEnabled = true;

  const speak = (text) => {
    window.speechSynthesis.cancel();   // stop previous speech
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  };

  const elements = document.querySelectorAll(
    "button, a, input, textarea, h1, h2, p"
  );

  elements.forEach((el) => {
    // speak ONLY the element's text, not the activation message
    const label = el.innerText || el.placeholder || "Input";

    el.onfocus = () => speak(label);
    el.onmouseover = () => speak(label);
  });

  // speak only once
  speak("TalkBack mode enabled");
};
