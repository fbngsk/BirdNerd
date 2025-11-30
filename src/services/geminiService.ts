import { GoogleGenAI } from "@google/genai";
import { IdentificationResult, VacationBirdResult } from "../types";

let ai: GoogleGenAI | null = null;

try {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    console.warn("Gemini API Key is missing. Add VITE_GEMINI_API_KEY to your .env file.");
  }
} catch (e) {
  console.warn("Gemini API Key setup failed:", e);
}

// ============================================
// IMPROVED PROMPTS
// ============================================

const BIRD_ID_PROMPT = `Du bist ein erfahrener Ornithologe, spezialisiert auf europäische Vögel.

AUFGABE: Analysiere das Bild und identifiziere den Vogel.

WICHTIG - Bildqualität beachten:
- Ist der Vogel scharf zu erkennen?
- Sind wichtige Merkmale sichtbar (Schnabel, Gefieder, Größe)?
- Gibt es Gegenlicht oder Verdeckungen?

ANALYSE-SCHRITTE:
1. Größe einschätzen (klein wie Spatz, mittel wie Amsel, groß wie Krähe)
2. Körperform und Silhouette
3. Schnabelform (dünn/dick, lang/kurz, gebogen/gerade)
4. Gefiederfarben und Muster
5. Besondere Merkmale (Haube, Augenring, Schwanzform)
6. Lebensraum im Bild (Wald, Wasser, Stadt, Feld)

ANTWORT-FORMAT (NUR JSON, kein Markdown):
{
  "identified": true/false,
  "name": "Deutscher Vogelname",
  "sciName": "Wissenschaftlicher Name",
  "confidence": "high" | "medium" | "low",
  "reasoning": "Kurze Begründung der Merkmale",
  "alternatives": [
    {"name": "Alternative 1", "sciName": "...", "reason": "Warum möglich"}
  ],
  "imageQuality": "good" | "acceptable" | "poor",
  "qualityIssues": ["Liste der Probleme falls vorhanden"]
}

CONFIDENCE-REGELN:
- "high": Klare Sicht, eindeutige Merkmale, >90% sicher
- "medium": Erkennbar aber nicht perfekt, 60-90% sicher
- "low": Schwer erkennbar, mehrere Arten möglich, <60% sicher

Wenn KEIN Vogel im Bild: {"identified": false, "reason": "Beschreibung was zu sehen ist"}`;

const GLOBAL_BIRD_PROMPT = `Du bist ein Experte für weltweite Ornithologie.

AUFGABE: Identifiziere den Vogel auf diesem Bild. Der Vogel kann aus jedem Land der Welt stammen.

ANTWORT-FORMAT (NUR JSON, kein Markdown):
{
  "identified": true/false,
  "name": "Deutscher Name (falls bekannt, sonst englischer Name)",
  "sciName": "Wissenschaftlicher Name",
  "confidence": "high" | "medium" | "low",
  "reasoning": "Kurze Begründung",
  "alternatives": [
    {"name": "Alternative", "sciName": "...", "reason": "Warum möglich"}
  ],
  "region": "Typisches Verbreitungsgebiet"
}

Wenn KEIN Vogel erkennbar: {"identified": false, "reason": "..."}`;

// ============================================
// TYPES
// ============================================

export interface BirdIdentificationResult {
  identified: boolean;
  name?: string;
  sciName?: string;
  confidence?: 'high' | 'medium' | 'low';
  reasoning?: string;
  alternatives?: Array<{name: string; sciName: string; reason: string}>;
  imageQuality?: 'good' | 'acceptable' | 'poor';
  qualityIssues?: string[];
  reason?: string; // For "not identified" cases
  region?: string; // For global birds
}

// ============================================
// FUNCTIONS
// ============================================

export const lookupBirdByName = async (birdName: string): Promise<VacationBirdResult | null> => {
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Der Nutzer sucht nach einem Vogel namens "${birdName}". 
            
Falls dieser Vogelname existiert (egal ob deutscher, englischer oder wissenschaftlicher Name), antworte mit einem JSON-Objekt:
{"name": "Korrekter deutscher Name (falls bekannt, sonst englisch)", "sciName": "Wissenschaftlicher Name"}

Falls der Name kein echter Vogelname ist oder du ihn nicht kennst, antworte mit:
{"name": "Unbekannt", "sciName": ""}

Antworte NUR mit dem JSON-Objekt, kein Markdown, kein Text davor oder danach.`
        });

        const text = response.text?.trim();
        if (!text) return null;

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const result: VacationBirdResult = JSON.parse(jsonStr);
            if (result.name === 'Unbekannt' || !result.name) return null;
            return result;
        } catch {
            return null;
        }
    } catch (error) {
        console.error("Bird lookup failed:", error);
        return null;
    }
};

export const identifyBirdFromDescription = async (description: string): Promise<string> => {
    if (!ai) return "KI nicht verfügbar";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Identifiziere den Vogel basierend auf dieser Beschreibung: "${description}". 
            
Du bist ein Experte für Ornithologie in Deutschland. Antworte AUSSCHLIESSLICH mit dem exakten deutschen Vogelnamen (z.B. 'Amsel', 'Kohlmeise', 'Buchfink'). Keine Sätze, keine Lateinischen Namen, keine Erklärungen.

Wenn du dir nicht sicher bist, antworte mit 'Unbekannt'.`
        });
        return response.text?.trim() || "Unbekannt";
    } catch (error) {
        return "Fehler bei der Analyse";
    }
};

/**
 * Improved bird identification with confidence scoring
 */
export const identifyBirdFromImage = async (base64Image: string): Promise<string | null> => {
    if (!ai) {
        console.warn("No AI instance found");
        return null;
    }

    try {
        const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                role: 'user',
                parts: [
                    { text: BIRD_ID_PROMPT },
                    { 
                        inlineData: { 
                            mimeType: 'image/jpeg', 
                            data: cleanBase64 
                        } 
                    }
                ]
            }
        });

        const text = response.text?.trim();
        console.log("Gemini Image ID Raw:", text);

        if (!text) return null;

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const result: BirdIdentificationResult = JSON.parse(jsonStr);
            console.log("Gemini Parsed Result:", result);
            
            if (!result.identified || !result.name) return null;
            
            // Store full result for later use
            lastIdentificationResult = result;
            
            return result.name;
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            // Fallback: try to extract name directly
            const nameMatch = text.match(/"name"\s*:\s*"([^"]+)"/);
            if (nameMatch) return nameMatch[1];
            return null;
        }
    } catch (error) {
        console.error("Image Analysis Failed:", error);
        return null;
    }
};

/**
 * Get full identification result with confidence and alternatives
 */
export const identifyBirdFromImageFull = async (base64Image: string): Promise<BirdIdentificationResult | null> => {
    if (!ai) {
        console.warn("No AI instance found");
        return null;
    }

    try {
        const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                role: 'user',
                parts: [
                    { text: BIRD_ID_PROMPT },
                    { 
                        inlineData: { 
                            mimeType: 'image/jpeg', 
                            data: cleanBase64 
                        } 
                    }
                ]
            }
        });

        const text = response.text?.trim();
        console.log("Gemini Full ID Raw:", text);

        if (!text) return null;

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const result: BirdIdentificationResult = JSON.parse(jsonStr);
            return result;
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            return null;
        }
    } catch (error) {
        console.error("Image Analysis Failed:", error);
        return null;
    }
};

// Store last result for reference
let lastIdentificationResult: BirdIdentificationResult | null = null;

export const getLastIdentificationResult = (): BirdIdentificationResult | null => {
    return lastIdentificationResult;
};

export const identifyBirdFromAudio = async (base64Audio: string): Promise<IdentificationResult[]> => {
    if (!ai) {
        console.warn("No AI instance found");
        return [];
    }

    try {
        const cleanBase64 = base64Audio.includes(',') ? base64Audio.split(',')[1] : base64Audio;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                role: 'user',
                parts: [
                    { text: `Analysiere diese Audioaufnahme auf Vogelstimmen. Es könnten mehrere Vögel gleichzeitig singen.
                    
Antworte AUSSCHLIESSLICH mit einem validen JSON-Array. 
Format: [{"name": "Deutscher Vogelname", "confidence": "hoch" | "mittel" | "niedrig"}]

Beispiel: [{"name": "Amsel", "confidence": "hoch"}, {"name": "Kohlmeise", "confidence": "mittel"}]

Wenn KEIN Vogel zu hören ist, antworte mit einem leeren Array: [].
Kein Markdown, kein Text davor oder danach.` 
                    },
                    { 
                        inlineData: { 
                            mimeType: 'audio/webm', 
                            data: cleanBase64 
                        } 
                    }
                ]
            }
        });
        
        const text = response.text?.trim();
        console.log("Gemini Audio ID Raw:", text);
        
        if (!text) return [];

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const results: IdentificationResult[] = JSON.parse(jsonStr);
            return results;
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            return [];
        }

    } catch (error) {
        console.error("Audio Analysis Failed:", error);
        return [];
    }
};

export const identifyBirdGlobal = async (base64Image: string): Promise<VacationBirdResult | null> => {
    if (!ai) {
        console.warn("No AI instance found");
        return null;
    }

    try {
        const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                role: 'user',
                parts: [
                    { text: GLOBAL_BIRD_PROMPT },
                    { 
                        inlineData: { 
                            mimeType: 'image/jpeg', 
                            data: cleanBase64 
                        } 
                    }
                ]
            }
        });

        const text = response.text?.trim();
        console.log("Gemini Global Bird ID Result:", text);

        if (!text) return null;

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const result: BirdIdentificationResult = JSON.parse(jsonStr);
            if (!result.identified || result.name === 'Unbekannt' || !result.name) return null;
            
            // Store for later
            lastIdentificationResult = result;
            
            return {
                name: result.name,
                sciName: result.sciName || ''
            };
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            return null;
        }
    } catch (error) {
        console.error("Global Bird Analysis Failed:", error);
        return null;
    }
};

/**
 * Full global identification with confidence
 */
export const identifyBirdGlobalFull = async (base64Image: string): Promise<BirdIdentificationResult | null> => {
    if (!ai) {
        console.warn("No AI instance found");
        return null;
    }

    try {
        const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                role: 'user',
                parts: [
                    { text: GLOBAL_BIRD_PROMPT },
                    { 
                        inlineData: { 
                            mimeType: 'image/jpeg', 
                            data: cleanBase64 
                        } 
                    }
                ]
            }
        });

        const text = response.text?.trim();
        if (!text) return null;

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            return JSON.parse(jsonStr);
        } catch {
            return null;
        }
    } catch (error) {
        console.error("Global Bird Analysis Failed:", error);
        return null;
    }
};
