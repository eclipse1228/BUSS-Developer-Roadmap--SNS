const Post = require('../db/Post');

async function getTopWriters(limit = 5) {
    try {
        const topwriters = await Post.aggregate([
            {
                $group: {
                    _id: '$author',
                    postCount: { $sum: 1 }
                }
            },
            {
                $sort: { postCount: -1 }
            },
            {
                $limit: limit
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            {
                $unwind: '$author'
            },
            {
                $project: {
                    username: '$author.name',
                    postCount: 1
                }
            }
        ]);

        console.log('Top writers:', topwriters); // 디버깅용 출력

        return topwriters;
    } catch (error) {
        console.error('Error fetching top writers:', error);
        throw new Error('Error fetching top writers: ' + error.message);
    }
}

module.exports = {
    getTopWriters
};
