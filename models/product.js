var mongoose=require("mongoose");

//Defining the Schema
var productSchema = new mongoose.Schema({
    title:String,
    image:[{type:String}],
    description :String,
    amount:Number,
    author:{
        id:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username:String
    },
    bookauthor:String,
    Created:{type:Date,default:Date.now},
    address:{
        area:String,
        city:String,
        state:String,
        country:String
    },
    phoneNumber:String,
    comments:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Comment"   
        }
    ]
});
//Making the model so that the DB is made
module.exports=mongoose.model("Product",productSchema);

