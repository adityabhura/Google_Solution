var express=require("express");
var router=express.Router();
var Product=require("../models/product.js");
var Myorder=require("../models/myorders.js");
var mongoose=require("mongoose");
var User=require("../models/user.js");
var request=require("request")

var multer=require("multer");
const { findById } = require("../models/user.js");

var storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,"./uploads/");
    },
    filename:function(req,file,cb){
        cb(null,file.fieldname + file.originalname);
    }
})
var upload=multer({storage:storage,
                    limits:{
                        fileSize:1024*1024*5,
                    },
                    fileFilter: (req, file, cb) => {
                        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
                          cb(null, true);
                        } else {
                          cb(null, false);
                          return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
                        }
                      }
}).array('image',1);

var successMessage={
    message:"Success"
}

var errorMessage={
    message:"Fail"
}


mongoose.set('useFindAndModify', false);


router.get("/products",function(req,res){
    var xerox=req.query.xerox;
    var currentUser=req.user;
    // console.log(req.session);
    // console.log(req.sessionID)
    Product.find({},function(err,products){
        if(err){
            console.log(err);
        }else{
            if(xerox==="book"){
                res.send({products,currentUser});
            }else{
                res.render("index",{products:products,currentUser:currentUser});
            }
        }
    })
});

router.get("/products/new",isLoggedIn,function(req,res){
    res.render("new");
})

router.post("/products",isLoggedIn,(req,res,next)=>{upload(req,res,function(err){
    if(err){
            req.flash("error","Only .png, .jpg and .jpeg format allowed!")
            res.redirect("/products/new");      
    }else{
        next();
    }
})},function(req,res){
    var title=req.body.title;
    var description=req.body.description;
    var address={
        area:req.body.area,
        city:req.body.city,
        state:req.body.state,
        country:req.body.country
    };
    var phoneNumber=req.body.phoneNumber
    console.log(req.body.phoneNumber);
    var author={
        id:req.user._id,
        username:req.user.username
    };
    var amount=req.body.amount;
    var bookauthor=req.body.bookauthor;
    //for uploading image
    var image=[];
    req.files.forEach(function(file){
        image.push(file.path)
    });   
        Product.create({
        title:title,
        description:description,
        author:author,
        amount:amount,
        address:address,
        phoneNumber:phoneNumber,
        image:image,
        bookauthor:bookauthor,
    },function(err,newProduct){
        if(err){
            console.log(err);
                res.send("Error");
        }else{
            User.findById(req.user._id,function(err,user){
                user.myproducts.push(newProduct)
                user.save();
                res.redirect("/products"); 
                console.log(newProduct);
                console.log(user.myproducts)
            })        
        }
    })
});


//Post route for adding new book in Mobile App
router.post("/products/xeroxbook",isLoggedIn,(req,res,next)=>{upload(req,res,function(err){
    if(err){
            res.send({
                "message":"Invalid File Format"
            });    
    }else{
        next();
    }
})},function(req,res){
    var title=req.query.title;
    var description=req.query.description;
    var address={
        area:req.query.area,
        city:req.query.city,
        state:req.query.state,
        country:req.query.country
    };
    var phoneNumber=req.query.phoneNumber
    console.log(req.query.phoneNumber);
    var author={
        id:req.user._id,
        username:req.user.username
    };
    var amount=req.query.amount;
    var bookauthor=req.query.bookauthor;
    //for uploading image
    var image=[];
    req.files.forEach(function(file){
        image.push(file.path)
    });
        Product.create({
        title:title,
        description:description,
        author:author,
        amount:amount,
        address:address,
        phoneNumber:phoneNumber,
        image:image,
        bookauthor:bookauthor,
    },function(err,newProduct){
        if(err){
            console.log(err);
            res.send(errorMessage);
        }else{
            User.findById(req.user._id,function(err,user){
                user.myproducts.push(newProduct)
                user.save();
                res.send(successMessage);
                console.log(newProduct);
                console.log(user.myproducts)
            })
          }
       })
   });



//show page
router.get("/products/:id",isLoggedIn,function(req,res){
    var xerox=req.query.xerox;
    Product.findById(req.params.id).populate("comments").exec(function(err,selectedProduct){
        if(err){
            console.log(err);
        }else{
            if(xerox==="book"){
                res.send(selectedProduct);
            }else{
                // console.log(selectedProduct);
                res.render("show",{product:selectedProduct});
            }
        }
    });
});

router.get("/products/:id/edit",checkUser,function(req,res){
    var xerox=req.query.xerox;
    Product.findById(req.params.id,function(err,product){
            if(xerox==="book"){
                res.send(product);
            }
            else{
                res.render("edit",{product :product}); 
            }
                   
    })
});

//put or update route
router.put("/products/:id",checkUser,function(req,res){
    var xerox=req.query.xerox;
    req.body.product.description=req.sanitize(req.body.product.description);
    Product.findByIdAndUpdate(req.params.id,req.body.product,function(err,product){
        if(err){
            if(xerox==="book"){
                res.send(errorMessage);
            }else{
                res.send("Error");
            }
        }else{
            if(xerox==="book"){
                res.send(successMessage);
            }else{
                res.redirect("/products/" + req.params.id);
            }
            
        }
            
    });
 });

 //delete route
 router.delete("/products/:id",checkUser,function(req,res){
    var xerox=req.query.xerox;
    Product.findByIdAndRemove(req.params.id,function(err){
            if(err){
                if(xerox==="book"){
                    res.send(errorMessage);
                }else{
                    res.send("Error");
                }  
            }else{
                if(xerox==="book"){
                    res.send(successMessage);
                }else{
                    req.flash("success","Product Removed")
                    res.redirect("/products");
                }

            }
            
        });
 });

//  //buy confirm form
//  router.get("/products/:id/buy/confirm",isLoggedIn,function(req,res){
//     res.render("confirmbuy");
//  })

//  router.get("/products/:id/buy",isLoggedIn,function(req,res){
//     Product.findById(req.params.id,function(err,product){
//             res.render("buyform",{product:product});
//     });
//  });

//  router.put("/products/:productid/buy/:id",isLoggedIn,
//             function(req,res,next){
//                 Product.findById(req.params.productid,function(err,foundProduct){
//                     var amount=req.body.product.quantity * foundProduct.amount;
//                     User.findById(req.params.id,function(err,user){
//                         if(err){
//                             console.log(err)
//                         }else{
//                             console.log(user.myproducts)
//                             Myorder.create({product:req.params.productid,
//                                             address:req.body.address,
//                                             quantity:req.body.product.quantity,
//                                             amount:amount,
//                                             status:true},
//                                 function(err,myorder){
//                                     if(err){
//                                         console.log(err);
//                                     }else{
//                                         myorder.author.id=req.user._id;
//                                         myorder.save();
//                                         console.log("hello")
//                                         console.log(myorder);
//                                         user.myorders.push(myorder);
//                                         user.save();
//                         //add ordered item to the sellers dashboard
//                             Product.findById(req.params.productid,function(err,product){
//                                 User.findById(product.author.id,function(err,user){
//                                     user.ordered.push(myorder)
//                                     user.save();
//                                     console.log(user.ordered)
//                                     sendEmailToSellerForOrderPlaced(req.user.username,product.title,product.author.id);
//                                     next();
//                                     })
//                                 })
//                                     }                       
//                                 })
//                             }
//                     })    
//                 }) 
//                 },
//         function(req,res){
//             Product.findByIdAndUpdate(req.params.productid,req.body.product,
//                 function(err,product){
//                     product.quantity=product.quantity-req.body.product.quantity;
//                     product.save()
//                     console.log(product.quantity)
//                     req.flash("success","Order Placed Succesfully, Keep Checking Your Dashboard for further details");
//                     res.redirect("/products/"+req.params.productid+"/buy/confirm");
//                 });
//     });
 
//if logged in function
    function isLoggedIn(req,res,next){
        if(req.isAuthenticated()){
            return next();
        }
            req.flash("error","You need to be logged in")
            res.redirect("/login");   
}

//check user logged in
    function checkUser(req,res,next){
        if(req.isAuthenticated()){
            Product.findById(req.params.id,function(err,foundProduct){
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


    // //******TESTING*****//
    // router.post('/a',(req,res,next)=>{
    //     // JSON.parse(req.body);
    //     res.send(req.body);
    //   });



    // router.post("/bookmark/:id/:userId",function(req,res){
    //     findById(req.user._id,function(err,user){
    //         if(err){
    //             console.log(err);
    //         }else{
    //             if(req.body.bookmark==="YES"){
    //                 user.bookmarks.push(req.params.id);
    //                 user.save();
    //                 console.log("Bookmarked");
    //                 console.log(user.bookmarks);
    //             }else{
    //                 var length=user.bookmarks.length;
    //                 for(var i=0;i<lenght;i++){
    //                     if(user.bookmarks[i]===req.params.id){
    //                         user.bookmarks.splice(i,1);
    //                         user.save();
    //                         console.log("Bookmark Removed");
    //                         console.log(user.bookmarks);
    //                     }
    //                 }
    //                 }
    //             }
                
    //         }
    //     )
    // })


    // router.post("/bookmark/notAuthorised",function(req,res){    
    //         req.flash("error","You need to be logged in"); 
    // })


 module.exports=router;