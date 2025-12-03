const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ========== ĐĂNG NHẬP ==========
router.post('/login', authController.login);

// ========== NGƯỜI DÙNG ==========
router.get('/users', authController.getUsers);
router.post('/users', authController.createUser);
router.put('/users/:id', authController.updateUser);
router.put('/users/:id/password', authController.changePassword);
router.delete('/users/:id', authController.deleteUser);

// ========== VAI TRÒ ==========
router.get('/roles', authController.getRoles);
router.post('/roles', authController.createRole);
router.put('/roles/:id', authController.updateRole);

module.exports = router;
