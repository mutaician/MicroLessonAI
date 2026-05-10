import RunwayML, { TaskFailedError } from "@runwayml/sdk";
import { env } from "./env";

type RunwayImageModel = "gpt_image_2";

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

function firstOutputUrl(output: unknown) {
  if (Array.isArray(output) && typeof output[0] === "string") {
    return output[0];
  }

  throw new Error("Runway task completed without an output URL.");
}
