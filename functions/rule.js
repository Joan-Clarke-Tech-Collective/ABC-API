const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

module.exports = function (app) {

  app.use(function (req, res, next) {
    console.log(req.get("Authorization"))
    const tokenId = req.get('Authorization').split('Bearer ')[1]
    admin.auth().verifyIdToken(tokenId)
      .then((decoded) => next())
      .catch((err) => res.status(401).send(err))
  })

  // Create Rule
  app.post('/api/rule', (req, res) => {
    (async () => {
      var newRuleRef = db.collection('rules/').doc()
      var newItem = {
        uuid: newRuleRef.id,
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        dateAdded: Date.now()
      }
      try {
        newRuleRef.set({ ...newItem })
        return res.status(200).send({ ...newItem });
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });

  // Read Rules
  app.get('/api/rule', (req, res) => {
    (async () => {
      try {
        console.log('Getting Rules')
        let query = db.collection('rules/');
        let response = [];
        await query.get().then(querySnapshot => {
          let docs = querySnapshot.docs;
          console.log(`Docs size = ${docs.length}`)
          for (let doc of docs) {
            const selectedItem = {
              uuid: doc.data().uuid,
              title: doc.data().title,
              description: doc.data().description,
              type: doc.data().type
            };
            response.push(selectedItem);
          }
        });
        console.log(response);
        return res.status(200).send(response);
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });

  // Update Rule Information
  app.put('/api/rule/:rule_id', (req, res) => {
    (async () => {
      try {
        const document = db.collection('rules').doc(req.params.rule_id);
        await document.update({
          title: req.body.title,
          description: req.body.description,
          type: req.body.type
        });
        return res.status(200).send();
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });

  // Delete Rule
  app.delete('/api/rule/:rule_id', (req, res) => {
    (async () => {
      try {
        const document = db.collection('rules').doc(req.params.rule_id);
        await document.delete();
        return res.status(200).send();
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });
}