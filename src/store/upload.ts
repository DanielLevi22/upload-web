import { create } from "zustand";
import { enableMapSet } from "immer";
import { immer } from "zustand/middleware/immer";
import { uploadFileToStorage } from "../http/upload-file-to-storage";
import { CanceledError } from "axios";
import { useShallow } from "zustand/shallow";
export type Upload = {
  name: string;
  file: File; 
  abortController: AbortController;
  status: "progress" | "success" | "error" | 'canceled';
  uploadSizeInBytes: number;
  originalSizeInBytes: number;
};

type UploadState = {
  uploads:  Map<string, Upload>;
  addUploads: (files: File[]) => void;
  cancelUpload: (uploadId: string) => void;
};

enableMapSet();
export const useUploads = create<UploadState, [["zustand/immer", never]]>(
  immer((set, get) => {

    async function processUpload(uploadId: string) {
      const  upload = get().uploads.get(uploadId);

      if(!upload) return;

      try {
        await uploadFileToStorage(
          {
            file: upload.file,
            onProgress: (sizeInBytes) => {
              set((state) => {
                state.uploads.set(uploadId, {
                  ...upload,
                  originalSizeInBytes: sizeInBytes,
                  status: "progress",
                });
              });
            },
          },
          {signal: upload.abortController.signal}

        )
  
        set((state) => {
          state.uploads.set(uploadId, {
            ...upload,
            status: "success",
          });
        });
        
      } catch (error) {
        if(error instanceof CanceledError) {
         return set((state) => {
            state.uploads.set(uploadId, {
              ...upload,
              status: "canceled",
            });
          });
        }
        console.log(error)
        
         set((state) => {
          state.uploads.set(uploadId, {
            ...upload,
            status: "error",
          });
        });
      }

    }

    function cancelUpload(uploadId: string) {
      const upload = get().uploads.get(uploadId);
      if(!upload) return;

      upload.abortController.abort();

    }


    function addUploads(files: File[]) {
      for (const file of files) {
        const uploadId = crypto.randomUUID();
        const abortController = new AbortController();

        const upload: Upload = {
          name: file.name,
          file,
          abortController,
          status: "progress",
          originalSizeInBytes: file.size,
          uploadSizeInBytes: 0,
        };

        set((state) => {
          state.uploads.set(uploadId, upload);
        });
        processUpload(uploadId)
      }
    }


    return {
      uploads: new Map(),
      addUploads,
      cancelUpload
    };
  })  
);


export const usePendingUploads = () => {
  return useUploads(
    useShallow((store) => {
      const isThereAnyPendingUploads = Array.from(store.uploads.values()).some(
        (upload) => upload.status === "progress"
      );

      if (!isThereAnyPendingUploads) {
        return { isThereAnyPendingUploads, globalPercentage: 100 };
      }

      const { total, uploaded } = Array.from(store.uploads.values()).reduce(
        (acc, upload) => {
          acc.total += upload.originalSizeInBytes;
          acc.uploaded += upload.uploadSizeInBytes;

          return acc;
        },
        { total: 0, uploaded: 0 }
      );

      const globalPercentage = Math.min(
        Math.round((uploaded * 100) / total),
        100
      );

      return { isThereAnyPendingUploads, globalPercentage };
    })
  );
};