// Generate password hash for seeding
// Run this in browser console to get hash for SQL

const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'chique_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Test
hashPassword('hamzahamza').then(h => console.log('hamzahamza:', h));
hashPassword('alfarissealfarisse').then(h => console.log('alfarissealfarisse:', h));
hashPassword('douniadounia').then(h => console.log('douniadounia:', h));