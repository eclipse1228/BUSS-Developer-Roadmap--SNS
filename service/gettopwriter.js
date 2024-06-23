const express = require('express');
const router = express.Router();
const Post = require('../db/Post');
const { getTopWriters } = require('./topwriter');

router.get('/', async (req, res) => {
    try {
        const topwriters = await getTopWriters();
        console.log('Top writers in route:', JSON.stringify(topwriters, null, 2)); // 디버깅용 출력

        const communityPosts = await Post.find({ category: 'community' }).populate('author').limit(5);
        const frontendPosts = await Post.find({ category: 'frontend' }).populate('author').limit(5);
        const backendPosts = await Post.find({ category: 'backend' }).populate('author').limit(5);

        const user = req.session.user || { id: 'guest' };
        res.render('main', { 
            user, 
            topwriters, 
            communityPosts, 
            frontendPosts, 
            backendPosts 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
