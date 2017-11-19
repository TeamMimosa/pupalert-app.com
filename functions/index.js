const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp(functions.config().firebase)

const dbRef = admin.database().ref()
const storageRef = admin.storage().bucket()

// cleans the database of old posts.
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
      storageRef.file(`posts/${post}`).delete()
    })

    res.send('Posts deleted: ' + oldPosts.join())
  })
})

// adjusts user's rank every time they have a new post
exports.adjustPupLevel = functions.database.ref('users/{uid}/total_posts')
.onUpdate(event => {
  const numPosts = event.data.val()

  for (const [key, value] of pupRanks) {
    if (key.inRange(numPosts)) {
      console.log(`Adjusting pupLevel to ${value}.`)
      return event.data.ref.parent.child('rank').set(value)
    }
  }
})

// represents the range [lowBound, highBound]
class Range {
  constructor(lowBound, highBound) {
    this.lowBound = lowBound
    this.highBound = highBound
  }

  inRange(num) {
    if (num < this.lowBound || num > this.highBound) {
      return false
    }

    return true
  }
}

const pupRanks = new Map([
  [new Range(0, 30), 'Baby Pup'],
  [new Range(31, 60), 'Pup'],
  [new Range(61, 110), 'Pupper'],
  [new Range(101, 160), 'Doggy'],
  [new Range(161, 230), 'Doggo'],
  [new Range(231, 310), 'Big ole Doggo'],
  [new Range(311, 400), 'Supreme Doggo'],
  [new Range(401, 500), 'Master Doggo'],
  [new Range(501, 610), 'Godlike Doggo']
])