const admin = require('firebase-admin');
const db = admin.firestore();

module.exports = {
  addIdToInmates: function (prisonId, prisonerId) {
    var modifyPrisonRef = db.collection('prison').doc('/' + prisonId + '/');

    modifyPrisonRef.update({
      inmates: admin.firestore.FieldValue.arrayUnion(prisonerId)
    });
  },

  removeFromInmates: function (prisoner_id, prison_id) {
    var modifyPrisonRef = db.collection('prison').doc('/' + prison_id + '/');

    return Promise.resolve(
      modifyPrisonRef.update({
        inmates: admin.firestore.FieldValue.arrayRemove(prisoner_id)
      })
    )
  },

  addConversationToPrisoner: function (prisonerID, userID) {
    var modifyPrisonerRef = db.collection('prisoner').doc('/' + prisonerID + '/');

    modifyPrisonerRef.update({
      chats: admin.firestore.FieldValue.arrayUnion(userID)
    })
  },

  removeConversationFromPrisoner: function (prisonerID, userID) {
    var modifyPrisonerRef = db.collection('prisoner').doc('/' + prisonerID + '/');

    var promise = new Promise(function (resolve, reject) {
      modifyPrisonerRef.update({
        chats: admin.firestore.FieldValue.arrayRemove(userID)
      });
    });
    return promise;


  },

  setPrisonToNull(prisonId) {
    return Promise.resolve(
      db.collection('prisoner').where('prison.uuid', '==', prisonId)
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            doc.ref.update({ prison: null });
          });
        })
    );
  },

  removeConversationFromUser(prisonerID) {
    return new Promise(function (resolve, reject) {
      (async () => {
        try {
          await db.collection('prisoner').doc(prisonerID)
            .get()
            .then((doc) => {
              console.log(`Doc: ${doc} | Doc Stringified ${JSON.stringify(doc)}`);
              console.log(`Data: ${doc.data()} | Data Stringified ${JSON.stringify(doc.data())}`);
              let chatsList = doc.data().chats;
              let prisonID = doc.data().prison.uuid;
              console.log(chatsList);

              chatsList.forEach((userId) => {
                console.log(`User ID: ${userId}`)
                const doc = db.collection('users').doc(userId).collection('chats').doc(prisonerID);
                doc.delete();
              });
              resolve(prisonID);
            }).catch((error) => {
              console.log(error);
            });
        } catch (error) {
          console.log(error);
        }
      })()
    }
    )
  },

  addToUnsentMessages(message) {
    var unsentMessageRef = db.collection('unsent').doc(message.uuid)

    return Promise.resolve(
      unsentMessageRef.set(message)
    )
  },

  markMessageAsSent(message) {
    return Promise.resolve(
      db.collection('users').doc(message.userId)
      .collection('chats').doc(message.prisonerId)
      .collection('messages').doc(message.uuid)
      .update({
        messageStatus: 'sent'
      })
    )
  },

  removeMessageFromUnsent(messageID) {
    return Promise.resolve(
      db.collection('unsent').doc(messageID).delete()
    )
  }

}