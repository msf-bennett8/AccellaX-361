// Quick script to check current user
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

(async () => {
  const profile = await AsyncStorage.getItem('userProfile');
  if (profile) {
    const user = JSON.parse(profile);
    console.log('Current User:', {
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      isOfflineAccount: user.isOfflineAccount,
      firebaseSynced: user.firebaseSynced
    });
  } else {
    console.log('No user found');
  }
})();
