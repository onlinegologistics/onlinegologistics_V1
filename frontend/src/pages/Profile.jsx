import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const getToken = () => JSON.parse(localStorage.getItem("userInfo"))?.token;

  const handleSendOTP = async () => {
    setMessage(null);

    if (!email && !newPassword) {
      setMessage({ type: "error", text: "Enter email or new password first." });
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword && !currentPassword) {
      setMessage({ type: "error", text: "Enter your current password." });
      return;
    }

    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOtpSent(true);
      setMessage({ type: "success", text: data.message });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async () => {
    setMessage(null);
    if (!otp) {
      setMessage({ type: "error", text: "Please enter the OTP." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ email, currentPassword, newPassword, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage({ type: "success", text: data.message });
      setEmail("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
      setOtpSent(false);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-6 mb-6 flex items-center gap-4 border border-white/10">
        <div className="bg-blue-500/20 p-3 rounded-full border border-blue-400/30">
          <User className="text-blue-400 w-7 h-7" />
        </div>
        <div>
          <h1 className="text-white text-xl font-bold">{user?.name}</h1>
          <p className="text-gray-400 text-sm">
            <span className="capitalize">{user?.role}</span>
            <span className="mx-1 text-gray-600">·</span>
            <span className="text-gray-500">@{user?.username}</span>
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">

        {/* Email Section */}
        <div>
          <h2 className="text-slate-800 font-semibold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-500" /> Update Email
          </h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter new email address"
            disabled={otpSent}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        <hr className="border-gray-100" />

        {/* Password Section */}
        <div>
          <h2 className="text-slate-800 font-semibold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-500" /> Change Password
          </h2>
          <div className="space-y-3">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              disabled={otpSent}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:bg-gray-50 disabled:text-gray-400"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              disabled={otpSent}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:bg-gray-50 disabled:text-gray-400"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={otpSent}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* OTP Section */}
        {otpSent && (
          <div>
            <h2 className="text-slate-800 font-semibold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" /> Enter OTP
            </h2>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit OTP sent to your email"
              maxLength={6}
              className="w-full border border-green-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-400 transition tracking-widest text-center font-bold text-lg"
            />
            <p className="text-xs text-gray-400 mt-2 text-center">
              Didn't receive?{" "}
              <button onClick={() => { setOtpSent(false); setOtp(""); setMessage(null); }} className="text-blue-500 hover:underline">
                Go back & resend
              </button>
            </p>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {message.type === "success"
              ? <CheckCircle className="w-4 h-4 shrink-0" />
              : <AlertCircle className="w-4 h-4 shrink-0" />}
            {message.text}
          </div>
        )}

        {/* Buttons */}
        {!otpSent ? (
          <button
            onClick={handleSendOTP}
            disabled={otpLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {otpLoading ? "Sending OTP..." : "Send OTP to Email"}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Verify OTP & Save Changes"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Profile;