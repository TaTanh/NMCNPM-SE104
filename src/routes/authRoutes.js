const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { checkAuth } = require('../middleware/authMiddleware');
const { validateLogin, validateCreateUser, validateChangePassword } = require('../middleware/validationMiddleware');

// ========== ĐĂNG NHẬP ==========
router.post('/login', validateLogin, authController.login);

// ========== NGƯỜI DÙNG ==========
router.get('/users', checkAuth, authController.getUsers);
router.post('/users', checkAuth, validateCreateUser, authController.createUser);
router.put('/users/:id', checkAuth, authController.updateUser);
router.put('/users/:id/password', checkAuth, validateChangePassword, authController.changePassword);
router.delete('/users/:id', checkAuth, authController.deleteUser);

// ========== VAI TRÒ ==========
router.get('/roles', checkAuth, authController.getRoles);
router.post('/roles', checkAuth, authController.createRole);
router.put('/roles/:id', checkAuth, authController.updateRole);

module.exports = router;
