import jwt from 'jsonwebtoken';

export const generateTokenAndSetCookie = (res, user) => {
  const payload = {
    id: user._id,
    name: user.name,
    role: user.role,
  };

  console.log("📦 Payload used for JWT:", payload); // <-- Add this

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });
};
