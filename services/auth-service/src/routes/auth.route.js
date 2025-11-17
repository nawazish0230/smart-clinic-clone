const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const {validateRegister, validateLogin, validateRefreshToken} = require('../middlewares/validator.middleware');


router
    .post('/register', validateRegister, authController.register)
    
router
    .post('/login', validateLogin, authController.login);
    
router
    .post('/refresh-token', validateRefreshToken, authController.refreshToken);

router
    .post('/logout', authController.logout);

router
    .get('/profile', authController.getProfile);

module.exports = router;