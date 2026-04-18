import React, { useState } from "react";
import { uploadCSV } from "../services/ngoApi";

const UploadCSV = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a CSV file first");
      setSuccess(false);
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      const res = await uploadCSV(file);
      setMessage(res.message || "Upload successful");
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setMessage("Upload failed. Please try again.");
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* HEADER */}
        <div style={styles.cardHeader}>
          <div style={styles.iconWrap}>📤</div>
          <div>
            <h2 style={styles.title}>Import CSV Data</h2>
            <p style={styles.subtitle}>Upload task requests and volunteer data</p>
          </div>
        </div>

        <div style={styles.divider} />

        {/* FILE DROP ZONE */}
        <label
          style={{
            ...styles.uploadBox,
            borderColor: isDragOver ? "#2563eb" : file ? "#22c55e" : "#dce6f5",
            background: isDragOver ? "#eff6ff" : file ? "#f0fdf4" : "#f8faff",
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped) { setFile(dropped); setMessage(""); }
          }}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {file ? (
            <div style={styles.fileInfo}>
              <span style={styles.fileIcon}>📄</span>
              <span style={styles.fileName}>{file.name}</span>
              <span style={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          ) : (
            <div style={styles.uploadPrompt}>
              <span style={styles.uploadIcon}>☁️</span>
              <p style={styles.uploadText}>Drag & drop your CSV file here</p>
              <p style={styles.uploadSubText}>or <span style={styles.browseLink}>click to browse</span></p>
            </div>
          )}
        </label>

        {/* FORMAT NOTE */}
        <p style={styles.formatNote}>
          Accepted format: <strong>.csv</strong> — max file size 10 MB
        </p>

        {/* BUTTON */}
        <button
          onClick={handleUpload}
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          disabled={loading}
        >
          {loading ? (
            <span>Uploading...</span>
          ) : (
            <span>Upload File</span>
          )}
        </button>

        {/* MESSAGE */}
        {message && (
          <div
            style={{
              ...styles.message,
              background: success ? "#f0fdf4" : "#fff1f2",
              color: success ? "#166534" : "#991b1b",
              border: `1px solid ${success ? "#bbf7d0" : "#fecdd3"}`,
            }}
          >
            <span>{success ? "✅" : "❌"}</span>
            {message}
          </div>
        )}
      </div>

      {/* TIPS */}
      <div style={styles.tips}>
        <h4 style={styles.tipsTitle}>CSV Format Guidelines</h4>
        <div style={styles.tipsList}>
          {[
            "First row should contain column headers",
            "Required: location, urgency, type, total_people",
            "Urgency values: HIGH, MEDIUM, LOW",
            "Dates should be in YYYY-MM-DD format",
          ].map((tip, i) => (
            <div key={i} style={styles.tip}>
              <span style={styles.tipDot} />
              <span style={styles.tipText}>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: "flex",
    gap: "24px",
    alignItems: "flex-start",
    maxWidth: "800px",
  },

  card: {
    background: "#ffffff",
    padding: "28px",
    borderRadius: "16px",
    width: "420px",
    boxShadow: "0 2px 12px rgba(10,31,92,0.07)",
    border: "1px solid #e2eaf5",
    flexShrink: 0,
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "18px",
  },

  iconWrap: {
    width: "44px",
    height: "44px",
    background: "#eff6ff",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    border: "1px solid #bfdbfe",
  },

  title: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#0a1f5c",
    margin: 0,
  },

  subtitle: {
    fontSize: "12px",
    color: "#8fa3c0",
    margin: "2px 0 0",
  },

  divider: {
    height: "1px",
    background: "#e8eef8",
    margin: "0 0 20px",
  },

  uploadBox: {
    display: "block",
    border: "2px dashed",
    padding: "28px 20px",
    borderRadius: "12px",
    cursor: "pointer",
    marginBottom: "10px",
    textAlign: "center",
    transition: "all 0.2s ease",
  },

  fileInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
  },

  fileIcon: {
    fontSize: "28px",
  },

  fileName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#059669",
  },

  fileSize: {
    fontSize: "11px",
    color: "#8fa3c0",
  },

  uploadPrompt: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },

  uploadIcon: {
    fontSize: "30px",
    marginBottom: "6px",
  },

  uploadText: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#0a1f5c",
    margin: 0,
  },

  uploadSubText: {
    fontSize: "12px",
    color: "#8fa3c0",
    margin: 0,
  },

  browseLink: {
    color: "#2563eb",
    fontWeight: "600",
  },

  formatNote: {
    fontSize: "11px",
    color: "#aabdd4",
    margin: "0 0 16px",
    textAlign: "center",
  },

  button: {
    padding: "11px",
    width: "100%",
    background: "#2563eb",
    border: "none",
    borderRadius: "10px",
    color: "white",
    fontWeight: "700",
    fontSize: "14px",
    transition: "background 0.2s",
  },

  message: {
    marginTop: "14px",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  tips: {
    background: "#ffffff",
    border: "1px solid #e2eaf5",
    borderRadius: "14px",
    padding: "20px 22px",
    flex: 1,
    boxShadow: "0 2px 8px rgba(10,31,92,0.04)",
  },

  tipsTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#0a1f5c",
    margin: "0 0 14px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },

  tipsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  tip: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
  },

  tipDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#2563eb",
    marginTop: "5px",
    flexShrink: 0,
  },

  tipText: {
    fontSize: "13px",
    color: "#5a7299",
    lineHeight: 1.5,
  },
};

export default UploadCSV;
