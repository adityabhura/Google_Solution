var express=require("express");
var router=express.Router();
var passport=require("passport");
var User=require("../models/user.js");
var randomstring=require("randomstring");
var Product=require("../models/product.js");
var request=require("request");
var mongoose=require("mongoose");

mongoose.set('useFindAndModify', false);

//register route
router.get("/register",function(req,res){
    res.render("register");
})

//post register route
router.post("/register",function(req,res){
    var xerox=req.query.xerox;
    var token=randomstring.generate();
    console.log(token);
    var active=false;
    User.register(new User({username:req.body.email,name:req.body.name,token:token,active:active,area:req.body.area,city:req.body.city,country:req.body.country}),req.body.password,function(err,user){
        if(err){
            console.log(err);
            if(xerox==="book"){
                res.send({
                    "message":err.message
                })
            }else{
                req.flash("error",err.message);
                res.redirect("/register");
            }  
        }else{
            sendEmail(user.username,user.token);
            req.flash("success","A verification code has been sent to your email. Enter the verification code to activate your account");
            res.redirect("/verify");
            console.log("Registered"); 
        }
    });
})

//login route
router.get("/login",function(req,res){
    res.render("login");
});

//login post route
router.post("/login",function(req,res,next){
var xerox=req.query.xerox;
User.findOne({username:req.body.username},function(err,user){
    if(!user){
         if(xerox==="book"){
                res.send({
                    "message":"Invalid Email or Password"
                })
            }else{
            req.flash("error","Invalid Email or Password")
            res.redirect("/login"); 
            }
    }else{
        if(!user.active){
            if(xerox==="book"){
                res.send({
                    "message":"Verify Your Account first"
                })
            }else{
            req.flash("error","Verify Your Account first");
            res.redirect("/login");
            }
        }
         return next();
    }
})
},passport.authenticate("local",{
    successRedirect:"/",
    failureFlash:'Invalid Email or Password',
    successFlash:"You successfully logged in",
    failureRedirect:"/login"
}),function(req,res){
});

//logout route
router.get("/logout",function(req,res){
    req.logout();
    req.flash("success","Logged Out");
    console.log("Logged out");
    res.redirect("/products");
})

//verify route
router.get("/verify",function(req,res){
    res.render("token");
})

router.post("/verify",function(req,res){
    var xerox=req.query.xerox;
    var token=req.body.token; 
    var error={
        "message":"Wrong code"
    }
    var success={
        "message":"Account Verified",
    }
   User.findOne({token:token},function(err,user){
    if(!user){
        if(xerox==="book"){
            res.send(error);
        }else{
            req.flash("error","Invalid Verification Code");
            res.redirect("/verify");
        }       
    }else{
        if(err){
            if(xerox==="book"){
                res.send(success);
            }else{
                req.flash("error","Error");
                redirect("/verify");
            } 
            console.log(err);
        }else{
            user.active=true;
            user.token="";
            console.log(user.active);
            console.log(user.username);
            if(xerox==="book"){
                res.send(success);
            }else{
                req.flash("success","Your Account Has Been verified")
                res.redirect("/login");  
            } 
            
            console.log(user);
            user.save();
        }
    }
   });
  
})

router.get("/profiles/:id",isLoggedIn,function(req,res){
    var xerox=req.query.xerox;
    User.findById(req.params.id,function(err,user){
        if(err){
            req.flash("error",err.message)
            res.redirect("/");
        }else{
            if(xerox==="book"){
                res.send(user)
            }else{
                res.render("profile",{user:user});
            }
            
        }
    })
})



router.get("/profiles/:id/myproducts",checkAuthorisation,function(req,res){
    User.findById(req.params.id).populate("myproducts").exec(function(err,user){
        if(err){
            console.log(err);
        }else{
            res.render("myproducts",{user:user});
        }
    });
})


router.get("/profiles/:id/mybookmarks",checkAuthorisation,function(req,res){
    User.findById(req.params.id).populate("bookmarks").exec(function(err,user){
        if(err){
            console.log(err);
            res.send(err);
        }else{
            res.render("mybookmarks",{user:user});
        }
    });  
})
//********THE END********//


//MIDDLEWARES
 //if logged in function
 function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
        req.flash("error","You need to be logged in")
        res.redirect("/login");   
}

//check authorisation
function checkAuthorisation(req,res,next){
 if(req.isAuthenticated()){
    User.findById(req.params.id,function(err,User){
        if(err){
            console.log(err);
            res.redirect("back");
        }else{
            if(req.user && User._id.equals(req.user._id)){
                next();
            }else{
                req.flash("error","You are not allowed to do that");
                res.redirect("back");
            }
        }
    })
} 
}

//check user logged in//
function checkUser(req,res,next){
    if(req.isAuthenticated()){
        Myorder.findById(req.params.productid,function(err,foundProduct){
            if(err){
                console.log(err);
            }else{
                if(foundProduct.author.id.equals(req.user._id)){
                    next();
                }else{
                    req.flash("error","You are not allowed to do that");
                    res.redirect("back");
                }
            }
        })
    }
}

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'testmailbhura@gmail.com',
    pass: 'testmail2002'
  }
});

function  sendEmail(mailid,code){
var mailOptions = {
  from: 'youremail@gmail.com',
  to: mailid,
  subject: 'Verfication Code',
  text: 'The Verification code is ' +code,
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
}

module.exports=router;
