var express=require("express");
var router=express.Router();
var passport=require("passport");
var User=require("../models/user.js");
var randomstring=require("randomstring");
var Product=require("../models/product.js");
var Myorder=require("../models/myorders.js");
var request=require("request");

//register route
router.get("/register",function(req,res){
    res.render("register");
})

//post register route
router.post("/register",function(req,res){
    var token=randomstring.generate();
    console.log(token);
    var active=false;
    User.register(new User({username:req.body.email,name:req.body.name,token:token,active:active,area:req.body.area,city:req.body.city,country:req.body.country}),req.body.password,function(err,user){
        if(err){
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("loacl")(req,res,function(){
            req.flash("success","Registered your account");
            sendEmail(user.username,user.token);
            res.redirect("/verify");
            console.log("Registered");
        });
    });
})

//login route
router.get("/login",function(req,res){
    res.render("login");
});

//login post route
router.post("/login",function(req,res,next){
User.findOne({username:req.body.username},function(err,user){
    if(!user){
        req.flash("error","Invalid Email or Password")
        res.redirect("/login");
    }else{
        if(!user.active){
            req.flash("error","Verify Your Account first");
            res.redirect("/login");
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
    var token=req.body.token;
   User.findOne({token:token},function(err,user){
    if(!user){
        req.flash("error","Invalid Verification Code");
        res.redirect("/verify");
    }else{
        if(err){
            console.log(err);
            res.redirect("/verify");
        }else{
            user.active=true;
            user.token="";
            console.log(user.active);
            console.log(user.username);
            req.flash("success","Your Account Has Been verified")
            res.redirect("/login");
            console.log(user);
            user.save();
        }
    }
   });
  
})

router.get("/profiles/:id",isLoggedIn,function(req,res){
    User.findById(req.params.id,function(err,user){
        if(err){
            req.flash("error",err.message)
            res.redirect("/");
        }else{
            res.render("profile",{user:user});
        }
    })
})
// .
router.get("/profiles/:id/myorders",checkAuthorisation,function(req,res){
    User.findById(req.params.id).populate({path:"myorders",model:"Myorder"}).populate({path:"myorders",model:"Myorder",populate:{path:"product",model:"Product"}}).exec(function(err,user){
        if(err){
            console.log(err);
        }else{
            res.render("myorders",{user:user});
        }
    });
})

router.get("/profiles/:id/myproducts",checkAuthorisation,function(req,res){
    User.findById(req.params.id).populate({path:"myproducts",model:"Product"}).exec(function(err,user){
        if(err){
            console.log(err);
        }else{
            res.render("myproducts",{user:user});
        }
    });
})

router.get("/profiles/:id/ordered",checkAuthorisation,function(req,res){
    User.findById(req.params.id).populate({path:"ordered",model:"Myorder"}).populate({path:"ordered",model:"Myorder",populate:{path:"product",model:"Product"}}).exec(function(err,user){
        if(err){
            console.log(err);
        }else{
            res.render("ordered",{user:user});
        }
    });  
})

router.get("/profiles/:id/ordered/:productid/track",checkAuthorisation,function(req,res){
    Myorder.findById(req.params.productid).populate({path:"product",model:Product}).exec(function(err,ordered){
        res.render("track",{order:ordered})
    })
})

router.put("/profiles/:id/ordered/:productid/track",checkAuthorisation,function(req,res){
    Myorder.findByIdAndUpdate(req.params.productid,req.body.myorder,function(err,order){
        var track={
            details:req.body.track,
            updated:Date.now()
        }
        sendEmailOfTrackingDetails(order.author.id,req.body.track);
        order.track.push(track);
        order.save();
        console.log(order.track)
        res.send("success")
    })
})

router.get("/profiles/:id/myorders/:productid/delete",checkUser,function(req,res){
    Myorder.findById(req.params.productid,function(err,myorder){
        res.render("cancelconfirm",{myorder:myorder})
    })
})

router.put("/profiles/:id/myorders/:productid/delete",checkUser,function(req,res){
    Myorder.findByIdAndUpdate(req.params.productid,req.body.myorder,function(err,myorder){
        myorder.status=false;
        myorder.updated=Date.now();
        myorder.save();
        cancelEmail(req.params.productid,req.user.username);
        console.log(req.user)
        res.redirect("/profiles/"+req.params.id+"/myorders")
    })
})

 //if logged in function
 function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
        req.flash("error","You need to logged in")
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

//check user logged in
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