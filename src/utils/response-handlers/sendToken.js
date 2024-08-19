// sendToken.js
export const sendToken = async (res, user, message, statusCode) => {
  const token = await user.getJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_TIME * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // Adjust SameSite attribute based on environment
  };

  res.status(200).cookie("vjpuser", token, options).json({
    success: true,
    statusCode: statusCode,
    token,
    message: message,
    user,
  });
};

export default sendToken;
