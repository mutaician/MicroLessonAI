import RunwayML, { TaskFailedError } from "@runwayml/sdk";
import { env } from "./env.js";
import type { TutorStyle } from "./types.js";

type RunwayImageModel = "gpt_image_2";
type RunwayTtsVoice =
  | "Maya"
  | "Arjun"
  | "Serene"
  | "Bernard"
  | "Billy"
  | "Mark"
  | "Clint"
  | "Mabel"
  | "Chad"
  | "Leslie"
  | "Eleanor"
  | "Elias"
  | "Elliot"
  | "Sandra"
  | "Kirk"
  | "Kylie"
  | "Lara"
  | "Lisa"
  | "Malachi"
  | "Marlene"
  | "Martin"
  | "Miriam"
  | "Paula"
  | "Pip"
  | "Rusty"
  | "Maggie"
  | "Jack"
  | "Katie"
  | "Noah"
  | "James"
  | "Rina"
  | "Ella"
  | "Mariah"
  | "Frank"
  | "Claudia"
  | "Niki"
  | "Vincent"
  | "Tom"
  | "Wanda"
  | "Benjamin"
  | "Kiana"
  | "Rachel";

export async function generateLessonImage(imagePrompt: string) {
  env.runwayApiSecret();
  const client = new RunwayML();

  try {
    const imageTask = await client.textToImage
      .create({
        model: env.runwayImageModel as RunwayImageModel,
        promptText: [
          imagePrompt,
          "Create a clean educational visual aid. Use minimal readable text, no logos, no copyrighted characters."
        ].join("\n"),
        ratio: "1920:1088",
        quality: "low",
        background: "opaque",
        outputCount: 1
      })
      .waitForTaskOutput();

    return firstOutputUrl(imageTask.output);
  } catch (error) {
    if (error instanceof TaskFailedError) {
      throw new Error(`Runway image generation failed: ${JSON.stringify(error.taskDetails)}`);
    }

    throw error;
  }
}

export async function generateLessonVideo(promptImage: string, videoPrompt: string) {
  env.runwayApiSecret();
  const client = new RunwayML();

  try {
    const videoTask = await client.imageToVideo
      .create({
        model: "gen4.5",
        promptImage,
        promptText: videoPrompt,
        ratio: "1280:720",
        duration: 5
      })
      .waitForTaskOutput();

    return {
      videoUrl: firstOutputUrl(videoTask.output)
    };
  } catch (error) {
    if (error instanceof TaskFailedError) {
      throw new Error(`Runway generation failed: ${JSON.stringify(error.taskDetails)}`);
    }

    throw error;
  }
}

export async function generateLessonAudio(audioScript: string, tutorStyle: TutorStyle) {
  env.runwayApiSecret();
  const client = new RunwayML();

  try {
    const audioTask = await client.textToSpeech
      .create({
        model: "eleven_multilingual_v2",
        promptText: audioScript.slice(0, 1000),
        voice: {
          type: "runway-preset",
          presetId: voiceForTutorStyle(tutorStyle)
        }
      })
      .waitForTaskOutput();

    return firstOutputUrl(audioTask.output);
  } catch (error) {
    if (error instanceof TaskFailedError) {
      throw new Error(`Runway audio generation failed: ${JSON.stringify(error.taskDetails)}`);
    }

    throw error;
  }
}

function voiceForTutorStyle(tutorStyle: TutorStyle): RunwayTtsVoice {
  const voices: Record<TutorStyle, string> = {
    calm: env.runwayTtsVoiceCalm,
    energetic: env.runwayTtsVoiceEnergetic,
    storyteller: env.runwayTtsVoiceStoryteller,
    "exam-prep": env.runwayTtsVoiceExamPrep
  };

  return voices[tutorStyle] as RunwayTtsVoice;
}

function firstOutputUrl(output: unknown) {
  if (Array.isArray(output) && typeof output[0] === "string") {
    return output[0];
  }

  throw new Error("Runway task completed without an output URL.");
}
