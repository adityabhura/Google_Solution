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
    bookmarks:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product",
    }],
    myproducts:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product"
    }],
});

UserSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model("User",UserSchema);