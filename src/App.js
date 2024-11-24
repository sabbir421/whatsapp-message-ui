import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { io } from "socket.io-client";
import { QRCodeCanvas } from "qrcode.react";
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  Grid,
  CircularProgress,
  Snackbar,
  IconButton,
} from "@mui/material";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import "react-toastify/dist/ReactToastify.css";
const url=process.env.URL
const socket = io("http://192.168.0.111:4001");

const App = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [qrCode, setQrCode] = useState(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isDeviceLinked, setIsDeviceLinked] = useState(false);

  useEffect(() => {
    socket.on("qr", (qr) => {
      console.log("QR Code received:", qr);
      setQrCode(qr);
      setReady(false);
    });

    socket.on("ready", () => {
      console.log("WhatsApp is ready!");
      setQrCode(null);
      setReady(true);
      toast.success("WhatsApp is ready!");
    });

    socket.on("auth_failure", (msg) => {
      console.error("Authentication failed:", msg);
      toast.error(msg);
      setIsDeviceLinked(false);
    });

    return () => {
      socket.off("qr");
      socket.off("ready");
      socket.off("auth_failure");
    };
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setSnackbarOpen(true);
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !message) {
      toast.error("Please provide both file and message.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("message", message);

    try {
      const response = await axios.post(
        "http://192.168.0.111:4001/send-messages",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success(response.data.message || "Messages sent successfully!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send messages.");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkDevice = async () => {
    setIsDeviceLinked(true);
    setQrCode(null);
    try {
      const response = await axios.get("http://192.168.0.111:4001/link-device");
      toast.info(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to link device.");
      setIsDeviceLinked(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "linear-gradient(to right, #4facfe, #00f2fe)",
        padding: 3,
      }}
    >
      <Paper
        sx={{
          padding: 4,
          width: "100%",
          maxWidth: 600,
          backgroundColor: "#fff",
          boxShadow: 3,
          borderRadius: 3,
          border: "2px solid #00f2fe",
        }}
      >
        <Typography
          variant="h4"
          sx={{ textAlign: "center", marginBottom: 3, color: "#1976d2" }}
        >
          WhatsApp Message Sender
        </Typography>

        {!isDeviceLinked && (
          <Box sx={{ textAlign: "center", marginBottom: 3 }}>
            <Button
              variant="contained"
              onClick={handleLinkDevice}
              sx={{
                backgroundColor: "#1976d2",
                color: "#fff",
                "&:hover": {
                  backgroundColor: "#1565c0",
                },
                borderRadius: "12px",
                padding: "10px 20px",
              }}
            >
              Link Device
            </Button>
          </Box>
        )}

        {qrCode && !ready && (
          <Box sx={{ textAlign: "center", marginBottom: 3 }}>
            <Typography variant="h6" sx={{ marginBottom: 2, color: "#333" }}>
              Scan QR Code to authenticate
            </Typography>
            <QRCodeCanvas value={qrCode} size={256} />
          </Box>
        )}

        {ready && (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Message"
                  variant="outlined"
                  fullWidth
                  value={message}
                  onChange={handleMessageChange}
                  placeholder="Enter your message here..."
                  required
                  multiline
                  rows={4}
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" component="label" fullWidth>
                  Upload Excel File
                  <input
                    type="file"
                    hidden
                    accept=".xlsx"
                    onChange={handleFileChange}
                  />
                </Button>
              </Grid>

              {fileName && (
                <Grid item xs={12} sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      marginTop: 2,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <FileCopyIcon sx={{ color: "#00f2fe", marginRight: 1 }} />
                    <Typography variant="body1">{fileName}</Typography>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Send Messages"
                  )}
                </Button>
              </Grid>
            </Grid>
          </form>
        )}

        <ToastContainer />
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={`File: ${fileName} uploaded successfully`}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};

export default App;
