
import JSZip from "jszip";

export async function filesToZip(files: Record<string,string>, root = "app"): Promise<Blob> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(`${root}/${path}`, content);
  }
  return zip.generateAsync({ type: "blob" });
}
