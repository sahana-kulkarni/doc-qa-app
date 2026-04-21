import { useState, useRef } from "react";
import axios from "axios";

interface Props {
  onUploadSuccess: (filename: string) => void;
}

export default function FileUpload({ onUploadSuccess }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("only PDF files are supported");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:3001/api/upload",
        formData,
      );
      setUploadedName(res.data.filename);
      onUploadSuccess(res.data.filename);
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: "24px" }}>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        style={{
          border: `2px dashed ${dragging ? "#4f46e5" : uploadedName ? "#16a34a" : "#d15d5db"}`,
          borderRadius: "12px",
          padding: "32px",
          textAlign: "center",
          cursor: uploading ? "not-allowed" : "pointer",
          background: dragging ? "#eef2ff" : uploadedName ? "#f0fdf4" : "#fff",
          transition: "all 0.2s",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {uploading ? (
          <>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>⏳</div>
            <p style={{ color: "#4f46e5", fontWeight: 500 }}>
              Processing PDF...
            </p>
            <p style={{ color: "#888", fontSize: "13px" }}>
              Generating embeddings, this may take a moment
            </p>
          </>
        ) : uploadedName ? (
          <>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>✅</div>
            <p style={{ color: "#16a34a", fontWeight: 500 }}>{uploadedName}</p>
            <p style={{ color: "#888", fontSize: "13px" }}>
              Click to upload a different file
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📂</div>
            <p style={{ color: "#374151", fontWeight: 500 }}>
              Drop a PDF here or click to browse
            </p>
            <p style={{ color: "#888", fontSize: "13px" }}>
              Supports PDF files only
            </p>
          </>
        )}
      </div>

      {error && (
        <p style={{ color: "#dc2626", fontSize: "13px", marginTop: "8px" }}>
          {error}
        </p>
      )}
    </div>
  );
}
