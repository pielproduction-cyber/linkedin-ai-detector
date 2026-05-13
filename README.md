# 🕵️ LinkedIn AI Detector (PoC)

**LinkedIn AI Detector** to lekkie rozszerzenie do przeglądarki Chrome, które pomaga zidentyfikować posty wygenerowane przez sztuczną inteligencję bezpośrednio w Twoim feedzie na LinkedIn. Projekt powstał jako Proof of Concept (PoC) wykorzystujący najnowszą technologię **Google Gemini API**.

![Przykładowe działanie](ai_detector.png)

## 📺 Demo Wideo
Obejrzyj rozszerzenie w akcji:
[Pobierz lub obejrzyj demo wideo (Linkedin_AI_Detector_nagrywka.mp4)](Linkedin_AI_Detector_nagrywka.mp4)


## 🚀 Główne Funkcje
- **Integracja Natywna**: Dodaje przycisk "🕵️ Analizuj AI" bezpośrednio pod postami na LinkedIn.
- **Analiza w Czasie Rzeczywistym**: Wykorzystuje model Gemini (np. 1.5 Flash) do oceny autentyczności tekstu.
- **Wizualne Wyniki**: Czytelne oznaczenia (Badge) informujące o prawdopodobieństwie użycia AI:
  - ✅ **Low**: Wygląda na napisane przez człowieka.
  - 🤔 **Medium**: Budzi pewne wątpliwości.
  - 🤖 **High**: Wysokie prawdopodobieństwo generacji przez AI.
- **Prywatność**: Klucz API jest przechowywany lokalnie w przeglądarce i nie jest przesyłany do zewnętrznych serwerów (poza samym Google Gemini API).

## 🛠️ Technologia
- **Frontend**: Vanilla JS, HTML5, CSS3 (z wykorzystaniem nowoczesnych gradientów i animacji).
- **Backend**: Chrome Extension API (Manifest V3).
- **AI**: Integracja z Google Gemini API via Fetch API.

## 📦 Instalacja (Dla Deweloperów)
1. Sklonuj to repozytorium.
2. Otwórz Chrome i przejdź do `chrome://extensions/`.
3. Włącz **Tryb dewelopera** (Developer mode) w prawym górnym rogu.
4. Kliknij **Załaduj rozpakowane** (Load unpacked) i wybierz folder z tym projektem.

## 📝 Konfiguracja
Aby rozszerzenie działało, musisz posiadać własny klucz API Google Gemini. Możesz go wygenerować bezpłatnie w [Google AI Studio](https://aistudio.google.com/app/apikey).

---
*Projekt ma charakter edukacyjny (PoC). Detekcja AI nie daje 100% pewności i powinna być traktowana jedynie jako wskazówka.*
