const BASE_URL = 'http://localhost:3000';

exports.buildAvatar = (avatar) => {
  return {
    small: avatar?.small
      ? `${BASE_URL}/${avatar.small}`
      : `${BASE_URL}/uploads/avatars/default-100.jpg`,

    large: avatar?.large
      ? `${BASE_URL}/${avatar.large}`
      : `${BASE_URL}/uploads/avatars/default-500.jpg`,
  };
};
