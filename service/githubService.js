const axios = require('axios');
const User = require('../models/User');

async function updateProfileWithGithub(username, userId) {
    try {
        const response = await axios.get(`https://api.github.com/users/${username}`);
        const profileImageUrl = response.data.avatar_url;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { githubUsername: username, profileImageUrl },
            { new: true }
        );

        if (!updatedUser) {
            throw new Error('User not found');
        }

        return { message: 'Profile updated successfully', user: updatedUser };
    } catch (error) {
        console.error(error);
        throw new Error('Failed to update profile');
    }
}

module.exports = {
    updateProfileWithGithub
};
