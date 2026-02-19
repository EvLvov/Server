const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs'); 

const Post = require('../models/Post');
const auth = require('../middleware/auth');
const upload = require('../middleware/postUpload');

// create
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const post = await Post.create({
      author: req.user.userId,
      text: req.body.text,
      image: req.file ? req.file.path : null,
    });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name email avatar');

    res.json(populatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get posts
router.get('/', async (req, res) => {
  const posts = await Post.find()
    .populate('author', 'name email avatar');
  res.json(posts);
});

// update
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

  
  const populatedPost = await Post.findById(post._id)
    .populate('author', 'name email avatar');

  res.json(populatedPost);
});

// delete 
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

  if (post.image) {
    try {
      const imagePath = post.image.replace(/\\/g, '/');
      
      const fullPath = path.join(__dirname, '..', imagePath);
      console.log('   - Полный путь:', fullPath);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      } else {
        const alternativePath = path.join(process.cwd(), 'uploads', 'posts', path.basename(post.image));
        if (fs.existsSync(alternativePath)) {
          fs.unlinkSync(alternativePath);
        }
      }
    } catch (err) {
      console.error('ошибка при удалении файла:', err);
    }
  }

  await post.deleteOne();

  res.json({ message: 'Post deleted' });
});

module.exports = router;