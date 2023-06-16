const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
const { body, validationResult } = require("express-validator")

module.exports = function(app)
{
  const funcs = require("./prison-func");

  app.use(function(req, res, next) {
    console.log(req.get("Authorization"));
    const tokenId = req.get("Authorization").split("Bearer ")[1]
     admin.auth().verifyIdToken(tokenId)
     .then((decoded) => next())
     .catch((err) => {res.status(401).send("unauthed in prison")
      console.log("unauthed in prison")
    })
  })

  // Create Prison
  app.post("/api/prison", 
    body("prisonName").notEmpty().toLowerCase(),
    body("address").notEmpty(),
    body("rules").isArray(),
    body("address.zip").isNumeric().isLength({min: 5, max: undefined}),
    body("address.city").notEmpty().isAlpha(),
    body("address.country").notEmpty().isAlpha().toLowerCase(),
    body("address.state").isAlpha().isLength({min: 2, max: undefined}),
    body("address.street").notEmpty(),
  (req, res) => {
    (async () => {
      console.log(req.body);
      var newPrisonRef = db.collection("prison").doc()
      var newItem = {
        uuid: newPrisonRef.id,
        prisonName: req.body.prisonName,
        address: req.body.address,
        inmates: req.body.inmates,
        rules: req.body.rules,
        dateAdded: Date.now()
      }
      try {
        newPrisonRef.set({ ...newItem })
        const errors = validationResult(req);
        if (errors.isEmpty()) {
          return res.status(200).send({ ...newItem }); 
        } else {
          console.log(errors)
          return res.status(400).send(errors);
        }
      } catch (error) {
        console.log(error);
        return res.status(500).send(error.code);
      }
    })();
  });

  // Read Prison By ID
  app.get("/api/prison/:prison_id", (req, res) => {
    console.log(req);
    (async () => {
      try {
        const document = db.collection("prison").doc(req.params.prison_id);
        let item = await document.get();
        let response = item.data();
        return res.status(200).send(response);
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });
  
  // Read All Prisons
  app.get("/api/prison", (req, res) => {
    (async () => {
      try {
        let query = db.collection("prison").orderBy("dateAdded", "desc");
        let response = []
        await query.get().then(querySnapshot => {
          let docs = querySnapshot.docs;
          for (let doc of docs) {
            const selectedItem = {
              inmates: doc.data().inmates,
              rules: doc.data().rules,
              prisonName: doc.data().prisonName,
              address: doc.data().address,
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

  // Delete Prison
  app.delete("/api/prison/:item_id", (req, res) => {
    (async () => {
      try {
        const document = db.collection("prison").doc(req.params.item_id);
        await funcs.setPrisonToNull(document.id).then(document.delete());
        return res.status(200).send(req.params.item_id);
      } catch (error) {
        console.log(error);
        return res.status(500).send(error);
      }
    })();
  });

    // Delete All Prisons
    app.delete("/api/prisons/all", (req, res) => {
      (async () => {
        try {
          let query = db.collection("prison");
          await query.get().then(querySnapshot => {
            let docs = querySnapshot.docs;
            for (let doc of docs) {
              doc.ref.delete().then(funcs.setPrisonToNull(doc.id));
            }
          });
          return res.status(200).send();
        } catch (error) {
          console.log(error);
          return res.status(500).send(error);
        }
      })();
    });
  
}