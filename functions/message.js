const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();

module.exports = function (app) {

  const funcs = require("./prison-func");

  app.use(function (req, res, next) {
    const tokenId = req.get("Authorization").split("Bearer ")[1]
    console.log(`Token ID = ${tokenId}`)
    admin.auth().verifyIdToken(tokenId)
      .then((decoded) => {
        console.log(`Succeeded with token: ${tokenId} `);
        next();
      })
      .catch((err) => {
        console.log(err);
        res.status(401).send("unauthed in message")
        console.log(`Failed with token: ${tokenId}`);
      })
  });

  // Create Message
  app.post("/api/message", (req, res) => {
    (async () => {
      var newMessageRef = db.collection("users/" + req.body.userId + "/chats/" + req.body.prisonerId + "/messages/").doc()
      var newMessage = {
        uuid: newMessageRef.id,
        sender: req.body.sender,
        prisonerId: req.body.prisonerId,
        userId: req.body.userId,
        body: req.body.body,
        messageStatus: "sent",
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      }
      try {
        await newMessageRef.set(newMessage).then(
          funcs.addToUnsentMessages(newMessage)
        );
        return res.status(200).send(newMessage);
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });

  // Create Conversation
  app.post("/api/conversation", (req, res) => {
    (async () => {
      console.log(`${req.body.userId} ${req.body.prisonerId} ${req.body.prisonerName}`)
      var query = db.collection("users/" + req.body.userId + "/chats/").doc(req.body.prisonerId);
      var newConversation = {
        uuid: req.body.prisonerId,
        prisonerName: req.body.prisonerName,
        firstContact: admin.firestore.FieldValue.serverTimestamp()
      }
      try {
        query.set(newConversation)
          .then(funcs.addConversationToPrisoner(req.body.prisonerId, req.body.userId))
        return res.status(200).send(newConversation);
      }
      catch (error) {
        // console.log(error);
        return res.status(500).send(error);
      }
    })();
  })

  // Read one message
    app.get("/api/message/:user_id/:prisoner_id/:message_id", (req, res) => {
      (async () => {
        try {
          const document = db.collection("users").doc(req.params.user_id)
          .collection("chats").doc(req.params.prisoner_id)
          .collection("messages").doc(req.params.message_id);
          let item = await document.get();
          let response = item.data();
          return res.status(200).send(response);
        } catch (error) {
          console.log(error);
          return res.status(500).send(error);
        }
      })();
    });

  // Read All Messages in a Conversation

  app.get("/api/message/:userId/:prisonerId", (req, res) => {
    console.log(`UserID: ${req.params.userId} PrisonerID ${req.params.prisonerId}`);
    (async () => {
      try {
        let query = db.collection("users/" + req.params.userId + "/chats/" + req.params.prisonerId + "/messages").orderBy("timestamp", "desc");
        let response = [];
        await query.get().then(querySnapshot => {
          let docs = querySnapshot.docs;
          console.log(`read ${docs.length} messages in a conversation`)

          for (let doc of docs) {
            const selectedItem = {
              uuid: doc.id,
              sender: doc.data().sender,
              body: doc.data().body,
              timestamp: doc.data().timestamp
            };
            response.push(selectedItem);
          }
        });
        return res.status(200).send(response);
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });

  // Read all conversations of a user
  app.get("/api/conversation/:userId", (req, res) => {
    (async () => {
      try {
        let query = db.collection("users/" + req.params.userId + "/chats/");
        let response = [];
        await query.get().then(querySnapshot => {
          let docs = querySnapshot.docs;
          for (let doc of docs) {
            const selectedItem = {
              uuid: doc.id,
              prisonerName: doc.data().prisonerName
            };
            response.push(selectedItem);
          }
        });
        return res.status(200).send(response);
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });

  // Read all unsent letters
  app.get("/api/message/unsent", (req, res) => {
    (async () => {
      try {
        let query = db.collection("unsent");
        let response = [];
        await query.get().then(querySnapshot => {
          let docs = querySnapshot.docs;
          for (let doc of docs) {
            const selectedItem = {
              uuid: doc.id,
              body: doc.data().body,
              messageStatus: doc.data().messageStatus,
              timestamp: doc.data().timestamp,
              prisonerId: doc.data().prisonerId,
              userId: doc.data().userId
            };
            response.push(selectedItem);
          }
        });
        return res.status(200).send(response);
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });
}  