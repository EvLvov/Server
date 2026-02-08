const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { buildAvatar } = require('../utils/avatar');


// создать пользователя
router.post('/', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// получить всех пользователей
router.get('/', async (req, res) => {
  const users = await User.find();

  const result = users.map(user => ({
    ...user.toObject(),
    avatar: buildAvatar(user.avatar),
  }));

  res.json(result);
});

// ✏ обновление пользователя
router.patch('/:id', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const requester = req.user;

    // проверка доступа
    if (
      requester.role !== 'admin' &&
      requester.userId !== targetId
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // запрещаем менять роль и пароль через этот роут
    const allowedUpdates = {
      name: req.body.name,
      email: req.body.email,
    };

    const updated = await User.findByIdAndUpdate(
      targetId,
      allowedUpdates,
      { new: true }
    ).select('-password');

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: 'Update error' });
  }
});

// 🗑 удаление пользователя
router.delete('/:id', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const requester = req.user;

    // удалять может только админ
    if (requester.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    await User.findByIdAndDelete(targetId);

    res.json({ message: 'User deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Delete error' });
  }
});

// 📸 загрузка аватара
router.post(
  '/:id/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    try {
      const targetId = req.params.id;
      const requester = req.user;

      if (
        requester.role !== 'admin' &&
        requester.userId !== targetId
      ) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file' });
      }

      const smallPath = `uploads/avatars/${targetId}_100.jpg`;
      const largePath = `uploads/avatars/${targetId}_500.jpg`;

      await sharp(req.file.buffer)
        .resize(100, 100)
        .jpeg()
        .toFile(smallPath);

      await sharp(req.file.buffer)
        .resize(500, 500)
        .jpeg()
        .toFile(largePath);

      const user = await User.findByIdAndUpdate(
        targetId,
        {
          avatar: {
            small: smallPath,
            large: largePath,
          },
        },
        { new: true }
      ).select('-password');

      res.json(user);
    } catch (e) {
      res.status(500).json({ message: 'Avatar upload error' });
    }
  }
);

// 🗑 удаление аватара
router.delete('/:id/avatar', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const requester = req.user;

    if (
      requester.role !== 'admin' &&
      requester.userId !== targetId
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const user = await User.findById(targetId);

    if (user.avatar?.small) fs.unlinkSync(user.avatar.small);
    if (user.avatar?.large) fs.unlinkSync(user.avatar.large);

    user.avatar = undefined;
    await user.save();

    res.json({ message: 'Avatar removed' });
  } catch (e) {
    res.status(500).json({ message: 'Avatar delete error' });
  }
});



module.exports = router;
