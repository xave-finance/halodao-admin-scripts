import * as firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/functions'

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.IREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID
}

firebase.initializeApp(firebaseConfig)

export const firestore = firebase.firestore()
export const functions = firebase.app().functions('asia-southeast2')
