var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");

var UserSchema=new mongoose.Schema({
    name:String,
    password:String,
    username:{type:String,unique:true},
    // phoneNumber:{type:Number,unique:true},
    token:String,
    active:Boolean,
    address:{
        area:String,
        city:String,
        state:String,
        country:String
    },
    coordinates:{
        latitude:Number,
        longitude:Number
    },
    myorders:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Myorder"
    }],
    myproducts:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product"
    }],
    ordered:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Myorder"
    }]
});

UserSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model("User",UserSchema);