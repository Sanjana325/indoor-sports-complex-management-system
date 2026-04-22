import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Card, Box, Typography, Button, IconButton
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { CreditCard, Receipt } from "@mui/icons-material";
import { BANK_DETAILS } from "../utils/constants";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// payment orchestrator for class enrollments supporting both automated and manual methods
const ClassPaymentModal = ({ open, onClose, classData, onPaymentSuccess }) => {
  const [step, setStep] = useState(1);
  const [slipFile, setSlipFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // initiates the PayHere gateway flow for instant credit card / online transactions
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

      // required configuration payload for the external payment gateway
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

  // handles multi-part form data submission for manual bank slip verification
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
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth 
      PaperProps={{ 
        className: "pbc-payment-dialog"
      }}
    >
      <DialogTitle className="pbc-dialog-title">
        Enrollment Payment: {classData?.Title}
        <IconButton 
          aria-label="close" 
          onClick={onClose} 
          sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent className="pbc-dialog-content">
        {step === 1 ? (
          <>
            {/* simple instruction on fee breakdown and total amount due */}
            <Typography variant="body1" className="pbc-dialog-subtext" sx={{ mb: 4 }}>
              To complete your enrollment, please pay the first 4-weeks fee of <strong>LKR {Number(classData?.Fee).toLocaleString()}</strong>.
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
              {/* triggers the automated card payment gateway */}
              <Card 
                className="pbc-method-card" 
                onClick={handleOnlinePayment}
              >
                <CreditCard className="pbc-method-icon" sx={{ color: '#00ff88' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Online Pay</Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>Instant Activation</Typography>
              </Card>
              {/* allows users to provide an offline bank transfer proof */}
              <Card 
                className="pbc-method-card" 
                onClick={() => setStep(2)}
              >
                <Receipt className="pbc-method-icon" sx={{ color: '#40c4ff' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Bank Slip</Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>Manual Verification</Typography>
              </Card>
            </Box>
          </>
        ) : (
          /* detailed view for bank account information and slip upload */
          <Box sx={{ mt: 1 }}>
            <Typography variant="body1" className="pbc-dialog-subtext" sx={{ mb: 3 }}>
                Deposit <strong>LKR {Number(classData?.Fee).toLocaleString()}</strong> to the following account:
            </Typography>
            
            <Box className="pbc-bank-card" sx={{ mb: 4 }}>
              <div className="pbc-bank-row">
                <span className="pbc-bank-label">Bank</span>
                <span className="pbc-bank-value">{BANK_DETAILS.bankName}</span>
              </div>
              <div className="pbc-bank-row">
                <span className="pbc-bank-label">Branch</span>
                <span className="pbc-bank-value">{BANK_DETAILS.branch}</span>
              </div>
              <div className="pbc-bank-row">
                <span className="pbc-bank-label">Owner</span>
                <span className="pbc-bank-value">{BANK_DETAILS.accountName}</span>
              </div>
              <div className="pbc-bank-row pbc-bank-acc-row">
                <span className="pbc-bank-label">Acc Number</span>
                <span className="pbc-bank-value pbc-acc-no">{BANK_DETAILS.accountNumber}</span>
              </div>
            </Box>

            <Typography variant="body2" className="pbc-dialog-subtext" sx={{ mb: 1.5, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Upload Transaction Slip</Typography>
            {/* interactive dropzone for selecting physical or digital payment proofs */}
            <div className="file-upload-zone" onClick={() => document.getElementById('slip-input-class').click()}>
                <Receipt sx={{ fontSize: '2rem', mb: 1, color: 'rgba(255,255,255,0.3)' }} />
                <Typography variant="body2" sx={{ color: slipFile ? '#00ff88' : 'rgba(255,255,255,0.5)' }}>
                    {slipFile ? slipFile.name : "Click to select or drag and drop slip"}
                </Typography>
                <input 
                    id="slip-input-class"
                    type="file" 
                    accept="image/*,application/pdf" 
                    onChange={(e) => setSlipFile(e.target.files[0])} 
                    style={{ display: 'none' }} 
                />
            </div>

            <Box sx={{ mt: 3 }}>
                <Button 
                    variant="contained" 
                    fullWidth 
                    className="pbc-submit-slip-btn"
                    onClick={handleBankSlipSubmit} 
                    disabled={!slipFile || uploading}
                >
                {uploading ? "Uploading..." : "Submit Enrollment Slip"}
                </Button>
                
                <Button 
                    fullWidth 
                    onClick={() => setStep(1)} 
                    sx={{ mt: 2, color: 'rgba(255,255,255,0.4)', textTransform: 'none', fontWeight: 600 }}
                >
                    Back to Payment Options
                </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions className="pbc-dialog-actions" sx={{ p: 2 }}>
        <Button onClick={onClose} className="pbc-cancel-btn">Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClassPaymentModal;
