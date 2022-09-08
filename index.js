const express = require('express');
const jwt = require("jsonwebtoken")
const { default: mongoose } = require('mongoose');
const Model = require('./userModel')
const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://santhosh:12345@backend.sx1ylzc.mongodb.net/test", {
    useNewUrlParser: true
})
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))

app.get('/', async(req,res)=>{
    res.send("EveryThing is working fine")
})
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true
}

const validPassword = function (password) {
    if (password.length <= 8 || password.length >= 15) return false
    return true
}

app.post('/user', async(req,res) => {
    let body = req.body
    let {name, age, city, phone, email, password, qualification} = body

    if(Object.keys(body).length == 0){
       return res.send({status: false, message: "please provide input request field"});
    }
    let array = [name, age, city, phone, email, password, qualification];
    for(let i = 0; i < array.length; i++){
        if(!isValid(array[i])){
           return res.status(400).send({status: false, message:"Mandatory field is missing"})
        }
    }
    if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
        return res.status(400).send({ status: false, message: "Email should be valid" })
    }
    if (!(/^[6-9]\d{9}$/.test(phone))) {
        return res.status(400).send({ status: false, message: "phone Number should be valid" })
    }
    if (!validPassword(password)) {
        return res.status(400).send({ status: false, message: "please type valid password" })
    }
    const isEmailPresent = await Model.findOne({ email: email })
    if (isEmailPresent) {
        return res.status(409).send({ status: false, message: "email address is already registered" })
    }
    const isPhonePresent = await Model.findOne({ phone: phone })
    if (isPhonePresent) {
       return res.status(409).send({ status: false, message: "phone is already registered" })
    }
    const user = await Model.create(body)
    return res.status(201).send({ status: true, message: "created successfully", data: user })

})
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

app.post('/login', async(req,res) => {
    let body = req.body
    if(Object.keys(body).length == 0){
        return res.send({status: false, message: "please provide login details"});
     }
    let { email, password } = body
    if(!isValid(email)) {
       return res.status(400).send({status:false, message: "Email is required"})
     }
    if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
       return res.status(400).send({ status: false, message: "Email should be valid" })
    }
    if(!isValid(password)) {
       return res.status(400).send({status:false, message: "password is required"})
    }
    let data = await Model.findOne({ email: email, password: password })
    if (!data) {
       return res.status(400).send({ status: false, message: "Invalid login credentials" })
    }
    else {
      let token = jwt.sign({ 
          userId: data._id,
          iat: Math.floor(Date.now()/1000),
          iat: Math.floor(Date.now()/1000) + 60 * 60 * 60}, "DreamRoots")              
          return res.status(200).send({ status: true, message: "User login successful", data: {token}})
        }
})

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

app.get('/userdetails', async(req,res) => {
    let token = req.headers["x-api-key"] || req.headers["x-Api-key"]
    if (!token) {
        return res.status(403).send({ status: false, message: "Token is required" })
    }
    let decodedToken = jwt.verify(token, 'DreamRoots')
    if (!decodedToken) {
        return res.status(401).send({ status: false, msg: "please enter valid token" })
    }else{
        req.userId = decodedToken.userId;
    }
    let findUser = await Model.findById(req.userId).select("name age city email phone qualification")
    return res.status(200).send({status:true, message:"user found successfully", user: findUser})
})

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

app.listen(5000, ()=> console.log("Express is running on port 5000..."))
