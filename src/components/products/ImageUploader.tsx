"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import toast from "react-hot-toast";
import type { ImageRecord } from "@/types";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  productId: string;
  images: ImageRecord[];
  onUpdate: () => void;
}

export default function ImageUploader({ productId, images, onUpdate }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (files: File[]) => {
      setUploading(true);
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("productId", productId);
        fd.append("makeMain", images.length === 0 ? "true" : "false");

        const res = await fetch("/api/images", { method: "POST", body: fd });
        if (!res.ok) {
          toast.error(`Error subiendo ${file.name}`);
        }
      }
      toast.success("Imágenes subidas");
      onUpdate();
      setUploading(false);
    },
    [productId, images.length, onUpdate]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxSize: 10 * 1024 * 1024,
  });

  async function handleSetMain(imageId: string) {
    await fetch("/api/images", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId, productId }),
    });
    onUpdate();
  }

  async function handleDelete(imageId: string) {
    await fetch("/api/images", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId }),
    });
    toast.success("Imagen eliminada");
    onUpdate();
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-brand-500 bg-brand-50" : "border-gray-300 hover:border-brand-400"
        )}
      >
        <input {...getInputProps()} />
        <p className="text-2xl mb-2">🖼️</p>
        <p className="text-sm text-gray-500">
          {uploading ? "Subiendo..." : isDragActive ? "Suelta aquí" : "Arrastra imágenes o haz clic para seleccionar"}
        </p>
        <p className="text-xs text-gray-400 mt-1">Máx 10 MB por imagen</p>
      </div>

      {/* Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
              <Image src={img.url} alt="" width={200} height={200} className="w-full h-32 object-cover" />
              {img.esPrincipal && (
                <span className="absolute top-1 left-1 text-xs bg-brand-600 text-white px-1.5 py-0.5 rounded">Principal</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.esPrincipal && (
                  <button
                    onClick={() => handleSetMain(img.id)}
                    className="text-xs bg-white text-gray-800 px-2 py-1 rounded"
                  >
                    Principal
                  </button>
                )}
                <button
                  onClick={() => handleDelete(img.id)}
                  className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
