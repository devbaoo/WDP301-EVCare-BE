import userService from '../services/userService.js';

const handleLoging = async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    if (!email || !password) {
        return res.status(500).json({
            errCode: 1,
            message: 'Missing inputs parameter!'
        })
    }

    let userData = await userService.handleUserLogin(email, password)
    //check email exist
    //password nhap vao ko dung
    //return userInfor
    // access_token :JWT json web token

    return res.status(200).json({
        errCode: userData.errCode,
        message: userData.errMessage,
        user: userData.user ? userData.user : {}
    })
};

// Get user profile (protected)
const getUserProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        // Optionally fetch fresh user data from DB via service if needed
        return res.status(200).json({ success: true, user: req.user });
    } catch (error) {
        console.error('Get user profile error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update user profile (protected)
const updateUserProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const updated = await userService.updateUserProfile(req.user.id, req.body);
        return res.status(200).json({ success: true, user: updated });
    } catch (error) {
        console.error('Update user profile error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export default {
    handleLoging,
    getUserProfile,
    updateUserProfile,
};