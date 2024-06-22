const Post = require('../db/Post');
const { ObjectId } = require('mongodb');

async function getTopWriters(limit = 5) {
    try {
        const pipeline = [
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
                    as: 'authorDetails'
                }
            },
            {
                $unwind: '$authorDetails'
            },
            {
                $project: {
                    _id: 0,
                    authorId: '$_id',
                    postCount: 1,
                    name: '$authorDetails.name',  // name 필드를 추가
                    profileImageUrl: '$authorDetails.profileImageUrl'
                }
            }
        ];

        const topwriters = await Post.aggregate(pipeline);

        console.log('Top writers after pipeline:', JSON.stringify(topwriters, null, 2)); // 디버깅용 출력

        return topwriters;
    } catch (error) {
        console.error('Error fetching top writers:', error);
        throw new Error('Error fetching top writers: ' + error.message);
    }
}

module.exports = {
    getTopWriters
};
