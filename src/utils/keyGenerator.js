export const generateKey = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = 'FRNK-';
  
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    key += characters[randomIndex];
  }
  
  return key;
};

export const validateKey = (key) => {
  const keyPattern = /^FRNK-[A-Z0-9]{4}$/;
  return keyPattern.test(key);
};