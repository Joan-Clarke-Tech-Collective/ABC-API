const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

module.exports = function (app) {

  app.use(function (req, res, next) {
    console.log(req);
    const tokenId = req.get('Authorization').split('Bearer ')[1]
    admin.auth().verifyIdToken(tokenId)
      .then((decoded) => next())
      .catch((err) => res.status(401).send(err))
  })

  // Create User
  app.post('/api/user', (req, res) => {
    (async () => {
      var newUserRef = db.collection('users').doc("/" + req.body.user.uuid + "/")
      try {
        newUserRef.set({
          uuid: req.body.user.uuid,
          userName: req.body.userName,
          penName: req.body.penName,
          address: req.body.address,
          bio: req.body.bio,
          email: req.body.email,
          permissions: 0
        })
        return res.status(200).send();
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });

  // Read All Users
  app.get('/api/user', (req, res) => {
    (async () => {
      try {
        let query = db.collection('users');
        let response = [];
        await query.get().then(querySnapshot => {
          let docs = querySnapshot.docs;
          for (let doc of docs) {
            const selectedItem = {
              email: doc.data().email,
              penName: doc.data().penName,
              permissions: doc.data().permissions,
              address: doc.data().address,
              uuid: doc.data().uuid
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

  // Read one user by uuid
  app.get('/api/user/:uuid', (req, res) => {
    (async () => {
      try {
        const document = db.collection('users').doc(req.params.uuid);
        let item = await document.get();
        let response = item.data();
        return res.status(200).send(response);
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });

  // Promote to admin
  app.put('/api/user/:uuid/promote', (req, res) => {
    (async () => {
      try {
        const document = db.collection('users').doc(req.params.uuid);
        await document.update({
          permissions: 1
        });
        return res.status(200).send();
      } catch (error) {
        return res.status(500).send('could not promote user');
      }
    })
  });

  // Update User Information
  app.put('/api/user/update/:user_id', (req, res) => {
    (async () => {
      try {
        console.log(req.body);
        const document = db.collection('users').doc(req.params.user_id);
        await document.set({
          userName: req.body.userName,
          penName: req.body.penName,
          address: {street: req.body.address.street,
                    city: req.body.address.city,
                    state: req.body.address.state,
                    zip: req.body.address.zip,
                    country: req.body.address.country
                    },
          bio: req.body.bio,
          email: req.body.email,
        });
        return res.status(200).send();
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });
}