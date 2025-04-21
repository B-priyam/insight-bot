"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Image,
  Video,
  X,
  Upload as UploadIcon,
  Eye,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { generateEmbeddingsInPineconeVectorStore } from "@/lib/test/langchain";
import { getResponse } from "@/lib/test/getResponse";
import { Input } from "./ui/input";
import { uploadFiles } from "@/lib/test/cloudinary";
import { getData } from "@/lib/retriveFromDatabase";

interface UploadedFiles {
  url?: string;
  original_name: string;
  public_id?: string;
}
interface FileUploadProps {
  accept: Record<string, string[]>;
  maxFiles?: number;
  onFilesSelected: (files: File[]) => void;
  type: "document" | "image" | "video";
  startProcessing?: () => void;
  processing?: boolean;
  progress?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  onFilesSelected,
  type,
  maxFiles,
  startProcessing,
  processing,
  progress,
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const [currentProcessingFile, setCurrentProcessingFile] = useState(1);
  const [uploadedFiles, setuploadedFiles] = useState<UploadedFiles[]>([]);

  const getUploadedFiles = async () => {
    const sessionData = sessionStorage.getItem(
      type === "image"
        ? "imageSession"
        : type === "document"
        ? "documentSession"
        : "videoSession"
    );
    if (sessionData) {
      const parsedSessionData = JSON.parse(sessionData);
      if (parsedSessionData?.chatId) {
        const data = await getData(parsedSessionData?.chatId);
        if (data) {
          setuploadedFiles(data.documents);
        }
      }
      if (parsedSessionData.files && parsedSessionData.update !== false) {
        setuploadedFiles(parsedSessionData.files);
      } else if (!parsedSessionData.files && !parsedSessionData.chatId) {
        setuploadedFiles([]);
      }
    }
  };

  useEffect(() => {
    setFiles([]);
    getUploadedFiles();
  }, [
    sessionStorage.getItem("imageSession"),
    sessionStorage.getItem("documentSession"),
    sessionStorage.getItem("videoSession"),
  ]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const uniqueFiles = acceptedFiles.filter(
        (newFile) =>
          !files.some(
            (existingFile) =>
              existingFile.name === newFile.name &&
              existingFile.size === newFile.size
          )
      );

      if (uniqueFiles.length > 0) {
        const newFiles = [...files, ...uniqueFiles].slice(0, maxFiles);
        setFiles(newFiles);
        onFilesSelected(newFiles);
      }
    },
    [maxFiles, onFilesSelected, files]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      onFilesSelected(newFiles);
      return newFiles;
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
  });

  const FileIcon = {
    document: FileText,
    image: Image,
    video: Video,
  }[type];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const fileVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 "
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer overflow-hidden",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        )}
        // whileHover={{ scale: 1.01 }}
        // whileTap={{ scale: 0.99 }}
      >
        <Input {...getInputProps()} />
        <motion.div
          className="flex flex-col items-center justify-center gap-4"
          animate={{
            y: isDragActive ? -10 : 0,
            scale: isDragActive ? 1.05 : 1,
          }}
        >
          <motion.div
            className="p-4 rounded-full bg-primary/10"
            animate={{
              scale: isDragActive ? 1.1 : 1,
              rotate: isDragActive ? 180 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <UploadIcon className="w-8 h-8 text-primary" />
          </motion.div>
          <div className="text-center">
            <motion.p
              className="text-lg font-medium bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent"
              animate={{ opacity: isDragActive ? 0.7 : 1 }}
            >
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </motion.p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to select files
              <p>
                Max file Size{" "}
                {`${
                  type === "video" ? "40MB" : type === "image" ? "10MB" : "20MB"
                }`}
              </p>
            </p>
          </div>
        </motion.div>
        {isDragActive && (
          <motion.div
            className="absolute inset-0 bg-primary/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </div>
      {uploadedFiles?.length > 0 && (
        <div>
          <p className="ml-2 mb-2">Uploaded files</p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {uploadedFiles.map((file, index) => (
              <Dialog key={`${file.original_name}-${index}`}>
                <motion.div
                  variants={fileVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  className="relative group w-72"
                >
                  <Card className="p-4 backdrop-blur-lg bg-background/80 border border-border/50 hover:border-primary/50 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {file.original_name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <DialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setPreviewUrl(file.url!)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        {/* <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button> */}
                      </div>
                    </div>
                    {type === "image" && (
                      <div className="mt-4 rounded-lg overflow-hidden aspect-video bg-muted">
                        <img
                          src={file.url}
                          alt={file.original_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {type === "video" && (
                      <div className="mt-4 rounded-lg overflow-hidden aspect-video bg-muted">
                        <video
                          src={file.url}
                          className="w-full h-full object-cover"
                          controls
                        />
                      </div>
                    )}
                  </Card>
                </motion.div>
                <DialogContent className="max-w-4xl w-full">
                  {type === "document" && (
                    <iframe
                      src={previewUrl || ""}
                      className="w-full h-[80vh]"
                      title={file.original_name}
                    />
                  )}
                  {type === "image" && (
                    <img
                      src={previewUrl || ""}
                      alt={file.original_name}
                      className="w-full h-auto max-h-[80vh] object-contain"
                    />
                  )}
                  {type === "video" && (
                    <video
                      src={previewUrl || ""}
                      controls
                      className="w-full h-auto max-h-[80vh]"
                    />
                  )}
                </DialogContent>
              </Dialog>
            ))}
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {(files.length > 0 || processing) && (
          <>
            <p className="ml-2 -mb-5">
              {uploadedFiles.length > 0 && "New Files"}
            </p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {files.map((file, index) => (
                <Dialog key={`${file.name}-${index}`}>
                  <motion.div
                    variants={fileVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    className="relative group w-72"
                  >
                    <Card className="p-4 backdrop-blur-lg bg-background/80 border border-border/50 hover:border-primary/50 transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <DialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() =>
                                setPreviewUrl(URL.createObjectURL(file))
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {type === "image" && (
                        <div className="mt-4 rounded-lg overflow-hidden aspect-video bg-muted">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {type === "video" && (
                        <div className="mt-4 rounded-lg overflow-hidden aspect-video bg-muted">
                          <video
                            src={URL.createObjectURL(file)}
                            className="w-full h-full object-cover"
                            controls
                          />
                        </div>
                      )}
                    </Card>
                  </motion.div>
                  <DialogContent className="max-w-4xl w-full">
                    {type === "document" && previewUrl ? (
                      previewUrl.endsWith(".pdf") ? (
                        <iframe
                          src={previewUrl}
                          className="w-full h-[80vh]"
                          title={file.name}
                        />
                      ) : (
                        <p className="text-center text-sm text-muted-foreground">
                          Cannot preview this document type. Download instead.
                          <a
                            href={previewUrl}
                            download={file.name}
                            className="text-primary underline"
                          >
                            Download file
                          </a>
                        </p>
                      )
                    ) : type === "image" ? (
                      <img
                        src={previewUrl || ""}
                        alt={file.name}
                        className="w-full h-auto max-h-[80vh] object-contain"
                      />
                    ) : type === "video" ? (
                      <video
                        src={previewUrl || ""}
                        controls
                        className="w-full h-auto max-h-[80vh]"
                      />
                    ) : null}
                  </DialogContent>
                  <DialogContent className="max-w-4xl w-full">
                    {type === "document" && (
                      <iframe
                        src={previewUrl || ""}
                        className="w-full h-[80vh]"
                        title={file.name}
                      />
                    )}
                    {type === "image" && (
                      <img
                        src={previewUrl || ""}
                        alt={file.name}
                        className="w-full h-auto max-h-[80vh] object-contain"
                      />
                    )}
                    {type === "video" && (
                      <video
                        src={previewUrl || ""}
                        controls
                        className="w-full h-auto max-h-[80vh]"
                      />
                    )}
                  </DialogContent>
                </Dialog>
              ))}
            </motion.div>

            {
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 w-72 md:w-full"
              >
                <Card className="p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-4 flex-col md:flex-row w-full gap-2">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Document Processing
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Process and index your documents for AI-powered analysis
                      </p>
                    </div>
                    <Button
                      onClick={startProcessing}
                      disabled={processing}
                      className="gap-2"
                    >
                      {processing ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Start Processing
                        </>
                      )}
                    </Button>
                  </div>
                  {processing && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-5">
                        <Progress value={progress} />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Processing documents: {Math.round(progress!)}%
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>
            }
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FileUpload;
