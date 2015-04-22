var express = require('express');
var router = express.Router();
var passport = require('passport');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/login', function(req, res, next){
    passport.authenticate('local', function(err, user, info) {
    //console.log("check index.js", err, "--", user, "--", info);
    if (err) {console.log("top err"); return next(err)}
    if (!user) {
      return res.status(404).json({code: 404, message: 'User not found'});
    }
    req.logIn(user, function(err) {
      //console.log("in logIn callback");
      //console.log(err);
      if (err) { return next(err); }
      return res.status(200).json({code: 200, message: 'User verified'})
    });
  })(req, res, next);
});



module.exports = router;
