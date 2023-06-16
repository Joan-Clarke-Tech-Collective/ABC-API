const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();


module.exports = function (app) {

const func = require('./prison-func');

  app.use(function (req, res, next) {
    console.log(req.get("Authorization"))
    const tokenId = req.get('Authorization').split('Bearer ')[1]
    admin.auth().verifyIdToken(tokenId)
      .then((decoded) => {
        console.log(tokenId)
        // console.log(decoded)
        next()
      })
      .catch((err) => {res.status(401).send("unauthorized in prisoner")
    console.log('unauthorized in prisoner')
    });
  })

  // Create Prisoner
  app.post('/api/prisoner', (req, res, next) => {
    (async () => {
      var newPrisonerRef = db.collection('prisoner').doc()
      console.log('creating prisoner')
      var newItem = {
        uuid: newPrisonerRef.id,
        birthName: req.body.birthName,
        preferredName: req.body.preferredName,
        prison: req.body.prison,
        inmateId: req.body.inmateId,
        bio: req.body.bio,
        releaseDate: req.body.releaseDate,
        icon: req.body.icon,
        dateAdded: Date.now()
      }
      try {
        newPrisonerRef.set({ ...newItem }).then(func.addIdToInmates(req.body.prison.uuid, newItem.uuid))
        return res.status(200).send({ ...newItem });
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });

    // Delete Prisoner
    app.delete('/api/prisoner/:prisoner_id', (req, res, next) => {
      (async () => {
        try {
          const document = db.collection('prisoner').doc(req.params.prisoner_id);
          await func.removeConversationFromUser(req.params.prisoner_id)
          .then((prisonId) => func.removeFromInmates(req.params.prisoner_id, prisonId))
          .then(document.delete())
          .catch((error) => console.log(error))
          return res.status(200).send(req.params.prisoner_id);
        } catch (error) {
          console.log(error);
          return res.status(500).send(error);
        }
      })();
    });

  // Read All Prisoners
  app.get('/api/prisoner', (req, res) => {
    (async () => {
      try {
        let query = db.collection('prisoner').orderBy('dateAdded', 'desc');
        let response = [];
        await query.get().then(querySnapshot => {
          let docs = querySnapshot.docs;
          for (let doc of docs) {
            const selectedItem = {
              birthName: doc.data().birthName,
              bio: doc.data().bio,
              inmateId: doc.data().inmateId,
              preferredName: doc.data().preferredName,
              prison: doc.data().prison,
              releaseDate: doc.data().releaseDate,
              icon: doc.data().icon,
              uuid: doc.data().uuid,
              dateAdded: doc.data().dateAdded
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

  // Read Prisoner By ID
  app.get('/api/prisoner/:item_id', (req, res) => {
    (async () => {
      try {
        const document = db.collection('prisoner').doc(req.params.item_id);
        let item = await document.get();
        let response = item.data();
        return res.status(200).send(response);
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });

  // Update Prisoner Information
  app.put('/api/prisoner/:item_id', (req, res) => {
    (async () => {
      try {
        const document = db.collection('prisoner').doc(req.params.item_id);
        await document.update({
          birthName: req.body.birthName,
          preferredName: req.body.preferredName,
          prison: req.body.prison,
          inmateId: req.body.inmateId,
          bio: req.body.bio,
          releaseDate: req.body.releaseDate
        });
        return res.status(200).send();
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });

  // Delete All Prisoners
  app.delete('/api/prisoner/all', (req, res) => {
    (async () => {
      try {
        let query = db.collection('prisoner');
        await query.get().then(querySnapshot => {
          let docs = querySnapshot.docs;

          for (let doc of docs) {
            let prisonerID = doc.data().uuid
            let prisonID = doc.data().prison.uuid
            ref.removeFromInmates(prisonerID, prisonID);

            doc.ref.delete();
          }
        });
        return res.status(200).send();
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });
};