// Firebase configuration
// Для работы глобальных лайков необходимо:
// 1. Создать проект в Firebase Console (https://console.firebase.google.com)
// 2. Включить Realtime Database
// 3. Установить правила безопасности для анонимного доступа
// 4. Скопировать конфигурацию и вставить ниже

export const firebaseConfig = {
  // Вставьте вашу конфигурацию Firebase здесь
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Правила безопасности для Firebase Realtime Database:
/*
{
  "rules": {
    "likes": {
      ".read": true,
      "$fragmentId": {
        "count": {
          ".write": true,
          ".validate": "newData.isNumber() && newData.val() >= 0"
        },
        "users": {
          "$userId": {
            ".write": "$userId === auth.uid || auth == null",
            ".validate": "newData.isBoolean()"
          }
        }
      }
    }
  }
}
*/