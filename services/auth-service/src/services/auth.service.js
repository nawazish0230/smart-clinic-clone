const { User, USER_ROLES, USER_STATUS } = require("../models/User");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const {
AuthenticationError,
ConflictError,
NotFoundError
} = require("../utils/errors");
const logger = require("../utils/logger");


/***
 * Register a new user
 * @param {Object} userData - User data (email, password, firstName, lastName, roles)
 * @returns {Object} - Registered user data and tokens
 */
const register = async (userData) => {
  const { email, password, firstName, lastName, roles } = userData;

  // check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  // set default roles of not provided
  const userRoles = roles && roles.length > 0 ? roles : [USER_ROLES.PATIENT];

  // create a new user
  const user = new User({
    email: email.toLowerCase(),
    password,
    firstName,
    lastName,
    roles: userRoles,
    status: USER_STATUS.ACTIVE,
  });

  // save the user
  await user.save();

  // generate token
  const tokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    roles: user.roles,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken({ userId: user._id.toString() });

  // save refresh token to user document
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`New user registered: ${user.email}`);
  // return user data and tokens

  return {
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      status: user.status,
    },
    accessToken,
    refreshToken,
  };
};

/***
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} - User data and tokens
 */
const login = async (email, password) => {
  // find the user with password field
  const user = await User.findByEmail(email).select("+password");

  // if user exist or not
  if (!user) {
    throw new AuthenticationError("Invalid email or password");
  }

  // check if user is active
  if (user.status !== USER_STATUS.ACTIVE) {
    throw new AuthenticationError("User is not active");
  }

  // verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AuthenticationError("Invalid email/password");
  }

  // generate tokens
  const tokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    roles: user.roles,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refereshToken = generateRefreshToken({ userId: user._id.toString() });

  // update refresh token in db
  user.refreshToken = refereshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${user.email}`);

  // return user data and tokens
  return {
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
      status: user.status,
    },
    accessToken,
    refereshToken,
  };
};

/***
 * Access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Object} - New access token
 * 
 */
const refreshToken = async (token) => {

  try{
    const decoded = verifyRefreshToken(token);

    const user = await User.findById(decoded.userId).select('+refreshToken');

    if(!user || user.refreshToken !== token){
        throw new AuthenticationError('Invalid refresh token');
    }

    if(user.status !== USER_STATUS.ACTIVE){
        throw new AuthenticationError('User is not active');
    }

    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      roles: user.roles,
    }

    const accessToken = generateAccessToken(tokenPayload);

    logger.info(`Access token refreshed for user: ${user.email}`);

    return{
      accessToken
    };
  }catch(error){
    throw new AuthenticationError('invalid or expired refresh token');
  }
}

/***
 * Logout user (invalidate refresh token)
 * @param {string} userId - UserId
 * 
 */
const logout = async (userId) => {
  const user = await User.findById(userId);

  if(!user){
    throw new NotFoundError('User not found');
  }

  user.refreshToken = null;
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged out: ${user.email}`);
}

/***
 * Get user profile
 * @param {string} userId - UserId
 * @returns {Object} - User profile
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if(!user){
    throw new NotFoundError('User not found');
  }

  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles,
    status: user.status,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt
  }
}


module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile
};
