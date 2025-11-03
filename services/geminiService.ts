import { GoogleGenAI, Modality, Chat } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateImage = async (prompt: string, aspectRatio: '1:1' | '9:16' | '16:9' | '4:3' | '3:4'): Promise<string[]> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: {
                numberOfImages: 4,
                outputMimeType: 'image/png',
                aspectRatio,
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
        } else {
            throw new Error("No images were generated.");
        }
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image. Please check the console for details.");
    }
};

export const generateStoryboardScene = async (
    prompt: string, 
    aspectRatio: '1:1' | '9:16' | '16:9' | '4:3' | '3:4', 
    characterImages: {data: string, mimeType: string}[]
): Promise<string> => {
    try {
        const imageParts = characterImages.map(img => ({ 
            inlineData: { data: img.data, mimeType: img.mimeType } 
        }));
        
        const finalPrompt = `${prompt}. The image should have a ${aspectRatio} aspect ratio.`;
        const textPart = { text: finalPrompt };
        
        const allParts = [...imageParts, textPart];

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: allParts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        if (response.candidates && response.candidates[0].content.parts[0].inlineData) {
            const base64ImageBytes = response.candidates[0].content.parts[0].inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        } else {
            console.warn("Image generation response was empty.", response);
            throw new Error("No image was generated for this scene. It might have been blocked for safety reasons.");
        }
    } catch (error) {
        console.error("Error generating storyboard scene:", error);
        throw new Error(`Failed to generate scene: "${prompt.substring(0, 20)}...". Check console for details.`);
    }
};


export const editImage = async (
    prompt: string, 
    imageBase64: string, 
    mimeType: string,
    referenceImage?: { data: string; mimeType: string; }
): Promise<string[]> => {
    try {
        const contentParts: ({ inlineData: { data: string; mimeType: string; }; } | { text: string; })[] = [
            { inlineData: { data: imageBase64, mimeType } },
        ];

        if (referenceImage) {
            contentParts.push({ inlineData: { data: referenceImage.data, mimeType: referenceImage.mimeType } });
        }
        
        contentParts.push({ text: prompt });

        // We will make 4 parallel calls to get different variations
        const requests = Array(4).fill(0).map(() => 
            ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: contentParts,
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            })
        );
        
        const responses = await Promise.all(requests);

        const imageUrls = responses.map(response => {
            if (response.candidates && response.candidates[0].content.parts[0].inlineData) {
                const base64ImageBytes = response.candidates[0].content.parts[0].inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
            // This case should ideally not be hit if the API call is successful
            throw new Error("A sub-request for an edited image failed to return data.");
        });

        if (imageUrls.length === 4) {
            return imageUrls;
        } else {
             throw new Error("Could not generate all 4 image variations.");
        }

    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Failed to edit image. Please check the console for details.");
    }
};


export const createChatSession = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: 'You are a helpful and creative assistant for a user working on a creative project. Be encouraging and provide insightful ideas.'
        }
    });
};