const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const Post = require('../models/Post');
const auth = require('../middleware/auth');

// @route       GET /api/posts
// desc         Get All Posts
// access       Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id }).sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
});

// @route       POST /api/posts
// desc         Create A Post
// access       Private
router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required')
        .not()
        .isEmpty(),
      check('body', 'Body is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, body } = req.body;

    try {
      const newPost = new Post({
        title,
        body,
        user: req.user.id
      });

      const post = await newPost.save();
      res.json(post);
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route       PUT /api/posts/:id
// desc         Update A Post
// access       Private
router.put('/:id', auth, async (req, res) => {
  const { title, body } = req.body;

  const postFields = {};
  if (title) postFields.title = title;
  if (body) postFields.body = body;

  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'No Post Found' });
    }

    // Make sure user own the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not Authorized' });
    }

    post = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: postFields },
      { new: true }
    );

    res.json(post);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
});

// @route       DELETE /api/posts/:id
// desc         Delete A Post
// access       Private
router.delete('/:id', auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post Not Found' });

    // Make Sure User own the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not Authorized' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Post Removed' });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
