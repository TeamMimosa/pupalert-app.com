const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp(functions.config().firebase)

const dbRef = admin.database().ref()

exports.cleanPosts = functions.https.onRequest((req, res) => {
  const oldPosts = []

  dbRef.child('posts').orderByChild('timestamp').once('value')
  .then(snapshot => {
    snapshot.forEach(child => {
      const post = child.val()
      const currentTime = new Date()
      const postTime = new Date(post.timestamp)
  
      if (currentTime - postTime > 60 * 60 * 1000) {  // older than an hour
        oldPosts.push(child.key)
      }
    })
    return oldPosts
  })
  .then(oldPosts => {
    console.log('cleaning old posts: ' + oldPosts.join())

    oldPosts.forEach(post => {
      dbRef.child(`geofire/${post}`).remove()
      dbRef.child(`posts/${post}`).remove()
    })
  })
})