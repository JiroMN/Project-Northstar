export default function logUploadProgress(label = "upload") {
  return function onProgress(progress) {
    const percent = Math.round(progress.progress * 100);

    console.log(
      `[${label}] ${percent}%`,
      `${progress.loaded} / ${progress.total} bytes`,
    );
  };
}
