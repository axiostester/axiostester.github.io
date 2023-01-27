const express = require("express");
const app = express();


const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));


app.set("view engine", "ejs");

const methodOverride = require('method-override')
app.use(methodOverride('_method'))


const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy 
const session = require('express-session')
app.use(session({secret: '비밀코드',resave : true , saveUninitialized: false}))
app.use(passport.initialize())
app.use(passport.session())


const MongoClient = require("mongoDB").MongoClient;

let db;
MongoClient.connect("mongodb+srv://kidcat:ueno88rabbit@cluster0.kst2jy8.mongodb.net/?retryWrites=true&w=majority", (error, client) => {
  if (error) return console.log(error);

  db = client.db("todoapp"); 

  app.listen(8080, () => {
    console.log("listening 8080");
  });
});


app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
  // res.send("ds");
});

app.get("/dog", (req, res) => {
  res.send("강아지 용품 페이지입니다.");
});

app.get("/beauty", (req, res) => {
  res.send("뷰티 용품 페이지입니다.");
});

app.get("/write", (req, res) => {
  res.sendFile(__dirname + "/write.html");
});


app.post("/add", (req, res) => {
  res.send("전송완료");

  db.collection('counter').findOne({name: '게시물갯수'} , (error,result)=>{

    let totalPostingCount = result.totalPost;

    db.collection("post").insertOne({_id : totalPostingCount + 1, 제목: req.body.title, 날짜: req.body.date },
      (error, result) => { 
        db.collection('counter').updateOne({name:'게시물갯수'},
        { $inc : {totalPost : 1}}, (error , result) => {
          if(error) return console.log(error);
        })
      });
  })
});

app.get("/list", (req, res) => {
  db.collection("post").find().toArray((error, result) => {
    res.render("list.ejs", { postdata: result });
  });
});


app.delete("/delete", (req, res) => {
  req.body._id = parseInt(req.body._id);

  db.collection("post").deleteOne(req.body, (error, result) => {
    console.log("삭제 완료");
  });
  res.send("삭제 완료");
});

app.get('/detail/:id', (req , res) =>{ 
  db.collection('post').findOne({_id : parseInt(req.params.id)} , (error,result) => {
    if (!result) return res.send('URL이 잘못 되었어요')
    res.render('detail.ejs', {postdata : result})

  })
})

app.get('/edit/:id', (req , res) =>{ 
  db.collection('post').findOne({_id : parseInt(req.params.id)} , (error,result) => {
    if (!result) return res.send('URL이 잘못 되었어요')
    res.render('edit.ejs', {postdata : result})
  })
})

app.put('/edit' , (req,res)=>{
  db.collection('post').updateOne({_id : parseInt(req.body.id)},
  {$set : {제목 : req.body.title, 날짜 : req.body.date }}, (error , result) => {
    console.log('수정완료');
    res.redirect('/list')
  })
})

app.get('/login', function(req, res) {
  res.render('login.ejs');
});

app.get('/fail', function(req, res) {
  res.render('fail.ejs');
});


app.post('/login', passport.authenticate('local', {failureRedirect: '/fail'}) ,function(req, res) { 
  res.redirect('/mypage'); 
});


passport.use(new LocalStrategy({
  usernameField: 'id', 
  passwordField: 'pw',
  session: true,
  passReqToCallback: false
}, function (입력한아이디, 입력한비번, done) {
  console.log(입력한아이디, 입력한비번);

  db.collection('login').findOne({id : 입력한아이디}, function(error, result) {
    if (error) { return done(error) }

    if (!result) { return done(null, false, { message: '존재하지 않은 아이디입니다.' }) } 

    if (입력한비번 == result.pw) { 
      return done(null, result) 
    } else {
      return done(null, false, { message: '비번이 틀렸어요.' })
    }
  })
}));


passport.serializeUser(function(user, done) {
  done(null, user.id)
});

passport.deserializeUser(function(아이디, done) { 

  db.collection('login').findOne({id: 아이디}, (error, result)=>{
    done(null , result)
  })
})

app.get('/mypage',loginFn,(req,res) => {
  console.log(req.user);
  res.render('myPage.ejs', {사용자 : req.user}) 
})

function loginFn (req, res, next) {
  if (req.user) { 
    next()
  } else {
    res.send('로그인 불가!');
  }
}

app.get('/search',(req,res)=>{
  console.log(req.query);
  db.collection('post').find({$text :{$search : req.query.value}}).toArray((error,result) => {
    console.log(result);
    res.render('search.ejs',{postdata : result})
  })
})