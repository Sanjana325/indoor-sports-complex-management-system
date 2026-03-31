import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Card, Box, Typography, Button, IconButton
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { CreditCard, Receipt } from "@mui/icons-material";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ClassPaymentModal = ({ open, onClose, classData, onPaymentSuccess }) => {
  const [step, setStep] = useState(1);
  const [slipFile, setSlipFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleOnlinePayment = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/player/payments/initiate-enrollment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ classId: classData.ClassID })
      });

      const payData = await res.json();
      if (!res.ok) {
        alert(payData.message || "Failed to initiate payment");
        return;
      }

      const payment = {
        sandbox: true,
        merchant_id: payData.merchant_id,
        return_url: window.location.origin + "/player/my-classes",
        cancel_url: window.location.origin + "/player/classes",
        notify_url: import.meta.env.VITE_PAYHERE_NOTIFY_URL,
        order_id: payData.order_id,
        items: payData.items,
        amount: payData.amount,
        currency: payData.currency,
        first_name: payData.customer_details.first_name,
        last_name: payData.customer_details.last_name,
        email: payData.customer_details.email,
        phone: payData.customer_details.phone,
        address: "N/A",
        city: "Colombo",
        country: "Sri Lanka",
        hash: payData.hash,
        custom_1: payData.custom_1,
        custom_2: payData.custom_2
      };

      if (window.payhere) {
        window.payhere.startPayment(payment);
      } else {
        alert("PayHere SDK not loaded. Please refresh the page.");
      }
    } catch (err) {
      console.error("Payment Error:", err);
      alert("An error occurred during payment initiation.");
    }
  };

  const handleBankSlipSubmit = async () => {
    if (!slipFile) {
        alert("Please select a file to upload.");
        return;
    }
    try {
      setUploading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("classId", classData.ClassID);
      formData.append("type", "CLASS");
      formData.append("slip", slipFile);

      const res = await fetch(`${API_BASE}/api/player/payments/slip`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to upload bank slip.");
        return;
      }

      alert("Bank slip uploaded successfully! It is pending admin verification.");
      onClose();
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err) {
      console.error("Upload error:", err);
      alert("An error occurred during slip upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1a1a1a', color: '#fff', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' } }}>
      <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 2 }}>
        Enrollment Payment: {classData?.Title}
        <IconButton aria-label="close" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 3 }}>
        {step === 1 ? (
          <>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.8 }}>
              To complete your enrollment, please pay the first 4-week fee of <strong>LKR {Number(classData?.Fee).toLocaleString()}</strong>.
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Card sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }, textAlign: 'center' }} onClick={handleOnlinePayment}>
                <CreditCard sx={{ fontSize: 40, color: '#00e676', mb: 1 }} />
                <Typography variant="h6">Online Pay</Typography>
                <Typography variant="caption" sx={{ opacity: 0.5 }}>Instant Activation</Typography>
              </Card>
              <Card sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }, textAlign: 'center' }} onClick={() => setStep(2)}>
                <Receipt sx={{ fontSize: 40, color: '#40c4ff', mb: 1 }} />
                <Typography variant="h6">Bank Slip</Typography>
                <Typography variant="caption" sx={{ opacity: 0.5 }}>Manual Verification</Typography>
              </Card>
            </Box>
          </>
        ) : (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>Deposit <strong>LKR {Number(classData?.Fee).toLocaleString()}</strong> to:</Typography>
            <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2, mb: 3, fontSize: '0.9rem' }}>
              <Typography variant="body2">Bank: Bank of Ceylon</Typography>
              <Typography variant="body2">Acc Name: Indoor Sports Complex</Typography>
              <Typography variant="body2">Acc Number: 0012 3456 7890 001</Typography>
            </Box>
            <input type="file" accept="image/*,application/pdf" onChange={(e) => setSlipFile(e.target.files[0])} style={{ color: '#fff', marginBottom: '20px', display: 'block' }} />
            <Button variant="contained" fullWidth sx={{ bgcolor: '#00e676', color: '#000', fontWeight: 700 }} onClick={handleBankSlipSubmit} disabled={!slipFile || uploading}>
              {uploading ? "Uploading..." : "Submit Slip"}
            </Button>
            <Button fullWidth sx={{ mt: 1, color: 'rgba(255,255,255,0.5)' }} onClick={() => setStep(1)}>Back</Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Button onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClassPaymentModal;
