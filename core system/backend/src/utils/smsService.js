export const sendOtpSms = async (phoneNumber, code) => {
  console.log(`📱 OTP sent to ${phoneNumber}: ${code} (valid for 5 minutes)`);
  return true;
};
