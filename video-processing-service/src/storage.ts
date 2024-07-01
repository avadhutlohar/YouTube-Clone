import { Storage } from "@google-cloud/storage";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { log } from "console";

const storage = new Storage();

const rawVideoBucketName = "raw-video-bucket";
const processedVideoBucketName = "processed-video-bucket";

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";

export function setupDiresctories() {
  ensureDirectoryExistence(localRawVideoPath);
  ensureDirectoryExistence(localProcessedVideoPath);
}

/**
 * @param rawVideoName - name of the  video file to convert from {@link localRawVideoPath}.
 * @param processedVideoName - name of the  video file to convert to {@link localProcessedVideoPath}.
 * @returns A promise that resolves when video has been converted.
 */

export function convertVideo(rawVideoName: string, processedVideoName: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
      .outputOptions("-vf", "scale=-1:360") //360
      .on("end", () => {
        console.log("Video processed successfully.");
        resolve();
      })
      .on("error", (err) => {
        console.log(`An error occurred: ${err.message}`);
        reject(err);
      })
      .save(`${localProcessedVideoPath}/${processedVideoName}`);
  });
}

/**
 * @param fileName - name of the file to download from {@link rawVideoBucketName} into the {@link localRawVideoPath} folder.
 * @returns A promise that resolves when the file has been downloaded.
 */

export async function downloadRawVideo(fileName: string) {
  await storage
    .bucket(rawVideoBucketName)
    .file(fileName)
    .download({ destination: `${localRawVideoPath}/${fileName}` });

  console.log(
    `gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}`
  );
}

/**
 * @param fileName - name of the file to upload from {@link localProcessedVideoPath} folder into the {@link processedVideoBucketName}.
 * @returns A promise that resolves when the file has been uploaded.
 */

export async function uploadProcessedVideo(fileName: string) {
  const bucket = storage.bucket(processedVideoBucketName);

  await bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
    destination: fileName,
  });
  console.log(
    `${localProcessedVideoPath}/${fileName} uploaded to gs://${processedVideoBucketName}/${fileName}`
  );

  await bucket.file(fileName).makePublic();
}

/**
 * @param fileName - name of the file to delete from {@link localRawVideoPath}.
 * @returns A promise that resolves when the file has been deleted.
 */

export function deleteRawVideo(fileName: string) {
  return deleteFile(`${localRawVideoPath}/${fileName}`);
}

/**
 * @param fileName - name of the file to delete from {@link localProcessedVideoPath}.
 * @returns A promise that resolves when the file has been deleted.
 */

export function deleteProcessedVideo(fileName: string) {
  return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

/**
 * @paramm filePath - The path of the file to delete.
 * @returns A promise that resolves when the file has been deleted.
 */
function deleteFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log(`Failed to  delete file at ${filePath}`, err);
          reject(err);
        } else {
          console.log(`File deleted successfully at ${filePath}`);
          resolve();
        }
      });
    } else {
      console.log(`File not found at ${filePath},skipping the delete`);
      resolve();
    }
  });
}

/**
 * Ensures a directory exist, creating it if necessary.
 * @param {string} dirPath - The directory path check.
 */
function ensureDirectoryExistence(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true }); // recursive: true enables creation of nested directories
    console.log(`Created directory ${dirPath}`);
  }
}
