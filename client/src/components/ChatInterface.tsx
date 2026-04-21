import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  filename: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export default function ChatInterface({
  filename,
  messages,
  setMessages,
}: Props) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAsk = async () => {
    if (!question.trim() || loading) return;

    const userMessage: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    //Add empty assistant message to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.replace("data: ", "");
          if (data === "[DONE]") break;

          try {
            const { text } = JSON.parse(data);
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: updated[updated.length - 1].content + text,
              };
              return updated;
            });
          } catch {
            //Empty catch
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid #e5e7eb",
          background: "#fafafa",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            color: "#666",
            margin: 0,
          }}
        >
          Chatting with <strong style={{ color: "#4f46e5" }}>{filename}</strong>
        </p>
      </div>

      {/* Messages */}
      <div
        style={{
          height: "400px",
          overflow: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{ textAlign: "center", color: "#9ca3af", marginTop: "80px" }}
          >
            <p style={{ fontSize: "32px", margin: "0 0 8px" }}>💬</p>
            <p style={{ fontSize: "15px" }}>Ask anything about your document</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "12px 16px",
                borderRadius:
                  msg.role === "user"
                    ? "18px 18px 4px 18px"
                    : "18px 18px 18px 4px",
                background: msg.role === "user" ? "#4f46e5" : "#f3f4f6",
                color: msg.role === "user" ? "#fff" : "#111",
                fontSize: "15px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.content ||
                (msg.role === "assistant" && loading ? (
                  <span style={{ opacity: 0.5 }}>Thinking...</span>
                ) : (
                  ""
                ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          gap: "10px",
        }}
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="Ask a question about your document..."
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "15px",
            outline: "none",
            background: loading ? "#f9fafb" : "#fff",
          }}
        />
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            background: loading || !question.trim() ? "#e5e7eb" : "#4f46e5",
            color: loading || !question.trim() ? "#9ca3af" : "#fff",
            border: "none",
            fontWeight: 500,
            fontSize: "15px",
            cursor: loading || !question.trim() ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {loading ? "..." : "Ask"}
        </button>
      </div>
    </div>
  );
}
