import React, { useState } from "react";
import axios from "axios";

const UploadCSV = ({ ngoId }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("ngo_id", ngoId);

    try {
      setLoading(true);
      setMessage("");

      const res = await axios.post(
        "http://127.0.0.1:8000/api/upload/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage(res.data.message || "Upload successful ✅");
    } catch (err) {
      console.error(err);
      setMessage("Upload failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>Upload CSV</h2>

      <input type="file" accept=".csv" onChange={handleFileChange} />

      <button
        onClick={handleUpload}
        style={styles.button}
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {message && <p style={{ marginTop: "10px" }}>{message}</p>}
    </div>
  );
};

const styles = {
  container: {
    background: "#f1f5f9",
    padding: "20px",
    borderRadius: "10px",
    maxWidth: "400px",
  },
  button: {
    marginTop: "10px",
    padding: "8px 12px",
    background: "#0ea5e9",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default UploadCSV;