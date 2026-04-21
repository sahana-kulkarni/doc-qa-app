import { useState } from "react";
import FileUpload from "./components/FileUpload";
import ChatInterface from "./components/ChatInterface";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function App() {
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f9fa",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "720px" }}>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 600,
            marginBottom: "8px",
            color: "#111",
          }}
        >
          Document Q&A
        </h1>
        <p style={{ color: "#666", marginBottom: "32px", fontSize: "15px" }}>
          Upload a PDF and ask questions about it
        </p>

        <FileUpload
          onUploadSuccess={(filename) => {
            setUploadedFile(filename);
            setMessages([]);
          }}
        />

        {uploadedFile && (
          <ChatInterface
            filename={uploadedFile}
            messages={messages}
            setMessages={setMessages}
          />
        )}
      </div>
    </div>
  );
}

export default App;
