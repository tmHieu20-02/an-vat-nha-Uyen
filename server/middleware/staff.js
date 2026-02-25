const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware: chỉ cho phép staff và admin
module.exports = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Không có token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'staff' && decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Chỉ staff/admin mới có quyền truy cập' });
        }
        req.user = decoded;
        next();
    } catch {
        return res.status(403).json({ success: false, message: 'Token không hợp lệ' });
    }
};
