export type Language = "en" | "kn" | "hi";

export const languageNames: Record<Language, string> = {
  en: "English",
  kn: "ಕನ್ನಡ",
  hi: "हिन्दी",
};

const translations: Record<string, Record<Language, string>> = {
  "sidebar.quickActions": { en: "Quick Actions", kn: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು", hi: "त्वरित कार्य" },
  "sidebar.explore": { en: "Explore", kn: "ಅನ್ವೇಷಿಸಿ", hi: "अन्वेषण करें" },
  "sidebar.bookTicket": { en: "Book Ticket", kn: "ಟಿಕೆಟ್ ಬುಕ್ ಮಾಡಿ", hi: "टिकट बुक करें" },
  "sidebar.myTickets": { en: "My Tickets", kn: "ನನ್ನ ಟಿಕೆಟ್‌ಗಳು", hi: "मेरे टिकट" },
  "sidebar.wallet": { en: "Wallet", kn: "ವಾಲೆಟ್", hi: "वॉलेट" },
  "sidebar.metroMap": { en: "Metro Map", kn: "ಮೆಟ್ರೋ ನಕ್ಷೆ", hi: "मेट्रो मानचित्र" },
  "sidebar.trainSchedule": { en: "Train Schedule", kn: "ರೈಲು ವೇಳಾಪಟ್ಟಿ", hi: "ट्रेन समय सारणी" },
  "sidebar.crowdInfo": { en: "Crowd Info", kn: "ಜನಸಂದಣಿ ಮಾಹಿತಿ", hi: "भीड़ जानकारी" },
  "sidebar.aiInsights": { en: "AI Insights", kn: "AI ಒಳನೋಟಗಳು", hi: "AI अंतर्दृष्टि" },
  "sidebar.accountSettings": { en: "Account Settings", kn: "ಖಾತೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳು", hi: "खाता सेटिंग्स" },
  "sidebar.signOut": { en: "Sign Out", kn: "ಸೈನ್ ಔಟ್", hi: "साइन आउट" },
  "sidebar.routePlanner": { en: "Route Planner", kn: "ಮಾರ್ಗ ಯೋಜಕ", hi: "मार्ग योजक" },
  "sidebar.accessibility": { en: "Accessibility", kn: "ಪ್ರವೇಶಿಸುವಿಕೆ", hi: "सुलभता" },

  "page.bookTicket": { en: "Book Ticket", kn: "ಟಿಕೆಟ್ ಬುಕ್ ಮಾಡಿ", hi: "टिकट बुक करें" },
  "page.myTickets": { en: "My Tickets", kn: "ನನ್ನ ಟಿಕೆಟ್‌ಗಳು", hi: "मेरे टिकट" },
  "page.wallet": { en: "Wallet", kn: "ವಾಲೆಟ್", hi: "वॉलेट" },
  "page.metroMap": { en: "Metro Map", kn: "ಮೆಟ್ರೋ ನಕ್ಷೆ", hi: "मेट्रो मानचित्र" },
  "page.trainSchedule": { en: "Train Schedule", kn: "ರೈಲು ವೇಳಾಪಟ್ಟಿ", hi: "ट्रेन समय सारणी" },
  "page.crowdMonitor": { en: "Crowd Monitor", kn: "ಜನಸಂದಣಿ ಮಾನಿಟರ್", hi: "भीड़ मॉनिटर" },
  "page.aiInsights": { en: "AI Insights", kn: "AI ಒಳನೋಟಗಳು", hi: "AI अंतर्दृष्टि" },
  "page.accountSettings": { en: "Account Settings", kn: "ಖಾತೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳು", hi: "खाता सेटिंग्स" },
  "page.routePlanner": { en: "Route Planner", kn: "ಮಾರ್ಗ ಯೋಜಕ", hi: "मार्ग योजक" },
  "page.accessibility": { en: "Accessibility", kn: "ಪ್ರವೇಶಿಸುವಿಕೆ", hi: "सुलभता" },

  "button.book": { en: "Book", kn: "ಬುಕ್ ಮಾಡಿ", hi: "बुक करें" },
  "button.cancel": { en: "Cancel", kn: "ರದ್ದುಮಾಡಿ", hi: "रद्द करें" },
  "button.submit": { en: "Submit", kn: "ಸಲ್ಲಿಸಿ", hi: "जमा करें" },
  "button.confirm": { en: "Confirm", kn: "ದೃಢೀಕರಿಸಿ", hi: "पुष्टि करें" },
  "button.search": { en: "Search", kn: "ಹುಡುಕಿ", hi: "खोजें" },
  "button.addMoney": { en: "Add Money", kn: "ಹಣ ಸೇರಿಸಿ", hi: "पैसे जोड़ें" },
  "button.findRoutes": { en: "Find Routes", kn: "ಮಾರ್ಗಗಳನ್ನು ಹುಡುಕಿ", hi: "मार्ग खोजें" },

  "label.from": { en: "From", kn: "ಇಂದ", hi: "से" },
  "label.to": { en: "To", kn: "ಗೆ", hi: "तक" },
  "label.fare": { en: "Fare", kn: "ದರ", hi: "किराया" },
  "label.status": { en: "Status", kn: "ಸ್ಥಿತಿ", hi: "स्थिति" },
  "label.balance": { en: "Balance", kn: "ಬಾಕಿ", hi: "शेष" },
  "label.source": { en: "Source", kn: "ಮೂಲ", hi: "स्रोत" },
  "label.destination": { en: "Destination", kn: "ಗಮ್ಯಸ್ಥಾನ", hi: "गंतव्य" },
  "label.language": { en: "Language", kn: "ಭಾಷೆ", hi: "भाषा" },

  "app.title": { en: "SmartAI Metro", kn: "ಸ್ಮಾರ್ಟ್ AI ಮೆಟ್ರೋ", hi: "स्मार्ट AI मेट्रो" },
  "app.subtitle": { en: "BMRCL Ticketing", kn: "BMRCL ಟಿಕೆಟಿಂಗ್", hi: "BMRCL टिकटिंग" },

  "routePlanner.title": { en: "Smart Route Planner", kn: "ಸ್ಮಾರ್ಟ್ ಮಾರ್ಗ ಯೋಜಕ", hi: "स्मार्ट मार्ग योजक" },
  "routePlanner.subtitle": { en: "Find the best route across Bangalore Metro lines", kn: "ಬೆಂಗಳೂರು ಮೆಟ್ರೋ ಮಾರ್ಗಗಳಲ್ಲಿ ಉತ್ತಮ ಮಾರ್ಗವನ್ನು ಹುಡುಕಿ", hi: "बेंगलुरु मेट्रो लाइनों में सबसे अच्छा मार्ग खोजें" },
  "routePlanner.selectDeparture": { en: "Select departure station", kn: "ನಿರ್ಗಮನ ನಿಲ್ದಾಣ ಆಯ್ಕೆಮಾಡಿ", hi: "प्रस्थान स्टेशन चुनें" },
  "routePlanner.selectArrival": { en: "Select arrival station", kn: "ಆಗಮನ ನಿಲ್ದಾಣ ಆಯ್ಕೆಮಾಡಿ", hi: "आगमन स्टेशन चुनें" },

  "accessibility.title": { en: "Accessibility", kn: "ಪ್ರವೇಶಿಸುವಿಕೆ", hi: "सुलभता" },
  "accessibility.subtitle": { en: "Accessible travel information for all passengers", kn: "ಎಲ್ಲ ಪ್ರಯಾಣಿಕರಿಗೆ ಪ್ರವೇಶಿಸಬಹುದಾದ ಪ್ರಯಾಣ ಮಾಹಿತಿ", hi: "सभी यात्रियों के लिए सुलभ यात्रा जानकारी" },
  "accessibility.mode": { en: "Accessibility Mode", kn: "ಪ್ರವೇಶಿಸುವಿಕೆ ಮೋಡ್", hi: "सुलभता मोड" },
  "accessibility.stationInfo": { en: "Station Accessibility", kn: "ನಿಲ್ದಾಣ ಪ್ರವೇಶಿಸುವಿಕೆ", hi: "स्टेशन सुलभता" },
  "accessibility.wheelchairTips": { en: "Wheelchair-Friendly Tips", kn: "ಗಾಲಿಕುರ್ಚಿ ಸ್ನೇಹಿ ಸಲಹೆಗಳು", hi: "व्हीलचेयर के अनुकूल सुझाव" },
  "accessibility.emergency": { en: "Emergency Contacts", kn: "ತುರ್ತು ಸಂಪರ್ಕಗಳು", hi: "आपातकालीन संपर्क" },
  "accessibility.audio": { en: "Audio Assistance", kn: "ಆಡಿಯೋ ಸಹಾಯ", hi: "ऑडियो सहायता" },

  "chatbot.title": { en: "Metro AI Assistant", kn: "ಮೆಟ್ರೋ AI ಸಹಾಯಕ", hi: "मेट्रो AI सहायक" },
  "chatbot.placeholder": { en: "Ask about metro...", kn: "ಮೆಟ್ರೋ ಬಗ್ಗೆ ಕೇಳಿ...", hi: "मेट्रो के बारे में पूछें..." },
  "chatbot.greeting": { en: "Hello! I'm your Namma Metro AI assistant. Ask me about train timings, routes, fares, crowd levels, or general metro information.", kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ನಮ್ಮ ಮೆಟ್ರೋ AI ಸಹಾಯಕ. ರೈಲು ಸಮಯ, ಮಾರ್ಗಗಳು, ದರಗಳು, ಜನಸಂದಣಿ ಮಟ್ಟ ಬಗ್ಗೆ ಕೇಳಿ.", hi: "नमस्ते! मैं आपका नम्मा मेट्रो AI सहायक हूँ। ट्रेन समय, मार्ग, किराया, भीड़ स्तर के बारे में पूछें।" },

  "map.title": { en: "Bangalore Metro Map", kn: "ಬೆಂಗಳೂರು ಮೆಟ್ರೋ ನಕ್ಷೆ", hi: "बेंगलुरु मेट्रो मानचित्र" },
  "map.subtitle": { en: "Tap any station for crowd levels and next trains", kn: "ಜನಸಂದಣಿ ಮಟ್ಟ ಮತ್ತು ಮುಂದಿನ ರೈಲುಗಳಿಗಾಗಿ ಯಾವುದೇ ನಿಲ್ದಾಣವನ್ನು ಟ್ಯಾಪ್ ಮಾಡಿ", hi: "भीड़ स्तर और अगली ट्रेनों के लिए किसी भी स्टेशन पर टैप करें" },
  "map.liveTrains": { en: "Live Trains", kn: "ಲೈವ್ ರೈಲುಗಳು", hi: "लाइव ट्रेनें" },
};

export function getTranslation(key: string, language: Language): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[language] || entry["en"] || key;
}
