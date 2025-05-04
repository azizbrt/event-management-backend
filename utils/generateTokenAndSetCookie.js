import jwt from 'jsonwebtoken';

export const generateTokenAndSetCookie = (res, user) => {
  // Create a payload that includes only the necessary info
  const payload = {
    id: user._id,
    name: user.name,  // Ensure user.name exists in the database
    role: user.role
  };

  // Sign the token with your secret
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1d', // Token expires in 1 day
  });

  // Set the token in a cookie (HTTP-only for security)
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookie in production
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
  });
};
