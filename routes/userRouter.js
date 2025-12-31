const express = require('express');
const router = express.Router();
const authController = require(`../controllers/authController`)
const userController= require('../controllers/userController')

//Token Protect
router.use(authController.protect)

//Admin Routes
router.use(authController.restrictTo('admin'))
router.route('/')
.get(userController.getUsers)
.post(userController.createUser)

router.route('/:id')
.get(userController.getOneUser)
.patch(userController.updateUser)
.delete(userController.deleteUser)

module.exports = router;