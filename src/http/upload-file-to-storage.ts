
import axios from "axios"


interface UploadFileToStorageParams  {
    file: File
    onProgress: (SizeInBytes: number) => void
}

interface UploadDFileToStorageOpts {
  signal?: AbortSignal
}
export async function uploadFileToStorage({file, onProgress}: UploadFileToStorageParams, opts?: UploadDFileToStorageOpts) {

  const  data = new FormData()
  data.append("file", file)
  const response = await axios.post<{ url: string}>("http://localhost:3333/uploads", data,{
    headers: {
      "Content-Type": "multipart/form-data"
    },
    signal: opts?.signal,
    onUploadProgress(progressEvent) {
      onProgress(progressEvent.loaded)
    }
  })

  return response.data.url
}