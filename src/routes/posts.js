const express = require('express');
const router = express.Router();

const Post = require('../models/Post');
const auth = require('../middleware/auth');
const upload = require('../middleware/postUpload');


// Create a new post
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const post = await Post.create({
      author: req.user.userId,
      text: req.body.text,
      image: req.file ? req.file.path : null,
    });

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all posts
router.get('/', async (req, res) => {
  const posts = await Post.find().populate('author', 'name');
  res.json(posts);
});

// Update a post
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post)
    return res.status(404).json({ message: 'Not found' });

  if (
    post.author.toString() !== req.user.userId &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  post.text = req.body.text ?? post.text;

  if (req.file) {
    post.image = req.file.path;
  }

  await post.save();

  res.json(post);
});

// Delete a post
router.delete('/:id', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post)
    return res.status(404).json({ message: 'Not found' });

  if (
    post.author.toString() !== req.user.userId &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await post.deleteOne();

  res.json({ message: 'Post deleted' });
});

module.exports = router;