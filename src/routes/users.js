const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { buildAvatar } = require('../utils/avatar');


// create user
router.post('/', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// get users
router.get('/', async (req, res) => {
  const users = await User.find();

  const result = users.map(user => ({
    ...user.toObject(),
    avatar: buildAvatar(user.avatar),
  }));

  res.json(result);
});

// update
router.patch('/:id', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const requester = req.user;

    if (
      requester.role !== 'admin' &&
      requester.userId !== targetId
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

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

// delete user
router.delete('/:id', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const requester = req.user;

    if (requester.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only' });
    }

    await User.findByIdAndDelete(targetId);

    res.json({ message: 'User deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Delete error' });
  }
});


// download
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

      const timestamp = Date.now();
      const smallPath = `uploads/avatars/${targetId}_${timestamp}_100.jpg`;
      const largePath = `uploads/avatars/${targetId}_${timestamp}_500.jpg`;

      await sharp(req.file.buffer)
        .resize(100, 100)
        .jpeg()
        .toFile(smallPath);

      await sharp(req.file.buffer)
        .resize(500, 500)
        .jpeg()
        .toFile(largePath);

      const oldUser = await User.findById(targetId);
      if (oldUser.avatar) {
        if (oldUser.avatar.small) {
          try { fs.unlinkSync(oldUser.avatar.small); } catch (e) {}
        }
        if (oldUser.avatar.large) {
          try { fs.unlinkSync(oldUser.avatar.large); } catch (e) {}
        }
      }

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

      res.json({
        ...user.toObject(),
        avatar: {
          small: `http://localhost:3000/${smallPath.replace(/\\/g, '/')}`,
          large: `http://localhost:3000/${largePath.replace(/\\/g, '/')}`
        }
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'Avatar upload error' });
    }
  }
);

// delete
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

    res.json({ 
      message: 'Avatar removed',
      avatar: {
        small: 'http://localhost:3000/uploads/avatars/default-100.jpg',
        large: 'http://localhost:3000/uploads/avatars/default-500.jpg'
      }
    });
  } catch (e) {
    res.status(500).json({ message: 'Avatar delete error' });
  }
});



module.exports = router;
