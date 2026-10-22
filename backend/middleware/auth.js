import jwt from 'jsonwebtoken';
import Faculty from '../models/Faculty.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key');
      
      req.user = await Faculty.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'Session invalid or user deleted. Please log in again.' });
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token invalid.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, token missing.' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Super Admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Administrative role required.' });
  }
};

export const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Super Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Super Administrator role required.' });
  }
};
