import express from "express"
import path from "path"
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


mongoose.connect("mongodb://127.0.0.1:27017/",{
    dbName:"backend",
}).then(()=>console.log("Database Connected"))
.catch((e)=>console.log(e));

const userSchema= new mongoose.Schema({
    name:String,
    email:String,
    password:String,
});

const User=mongoose.model("User",userSchema);

const app=express();

// const users=[];

//using middlewares
app.use(express.static(path.join(path.resolve(),"public")));
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());

//setting up view engine 
app.set("view engine","ejs");


const isAuthenticated=async (req,res,next)=>{
    const {token} = req.cookies;
    if(token){
        const decoded=jwt.verify(token,"shfbiashsfkhb");
        console.log(decoded)
        req.user=await User.findById(decoded._id)
        next();
    }
    else{
        res.redirect("login");
    }
}

app.get("/",isAuthenticated,(req,res)=>{
    console.log(req.user)
    res.render("logout",{name:req.user.name});
})

app.get("/login",(req,res)=>{
    res.render("login");
})

app.get("/register",(req,res)=>{
    res.render("register")
})

// app.get("/success",(req,res)=>{
//     res.render("success");
// })

// app.get("/",(req,res)=>{
//     // res.send("Hii");
//     // res.json({
//     //     success:true,
//     //     products:[]
//     // })
//     // console.log(path.resolve());
//     // const pathLocation=path.resolve();
//     //res.sendFile(path.join(pathLocation,"./index.html"));
//     // res.sendFile("./index.html")
// })

// app.get("/add",async (req,res)=>{
//         await Message.create({name:"Amit2",email:"sample2@gmail.com"});
//         res.send("nice");
// });

// app.post("/contact",async (req,res)=>{
//     // const messageData=({name:req.body.name,email:req.body.email})
//     // console.log(messageData);
//     // await Message.create(messageData);
//     const {name,email}=req.body;
//     await Message.create({name,email})
//     res.redirect("/success")
// })

app.post("/login",async(req,res)=>{
    const {email,password}=req.body;
    let user=await User.findOne({email});
    if(!user){
      return res.redirect("/register");
    }
    const isMatch= await bcrypt.compare(password,user.password);
    if(!isMatch){
        return res.render("login",{email,message:"Incorrect Password"});
    }
    const token=jwt.sign({_id:user._id},"shfbiashsfkhb");
    console.log(token);

    res.cookie("token",token,{
        httpOnly:true,
        expires:new Date(Date.now()+60*1000),
    });
    res.redirect("/");
 })

app.post("/register",async (req,res)=>{
    const {name,email,password}=req.body

    let user= await User.findOne({email});
    if(user){
        return res.redirect("/login");
    }

    const hashedPassword = await bcrypt.hash(password,10);

    user=await User.create({
        name,
        email,
        password:hashedPassword,
    })

    const token=jwt.sign({_id:user._id},"shfbiashsfkhb");
    console.log(token);

    res.cookie("token",token,{
        httpOnly:true,
        expires:new Date(Date.now()+60*1000),
    });
    res.redirect("/");
})


app.get("/logout",(req,res)=>{
    res.cookie("token",null,{
        httpOnly:true,
        expires:new Date(Date.now()),
    });
    res.redirect("/");
})

// app.get("/users",(req,res)=>{
//     res.json({
//         users,
//     })
// })

app.listen(5000,()=>{
    console.log("Server is Working");
});
