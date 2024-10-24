const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const port = 3019

const app = express();
app.use(express.urlencoded({extended:true}))

mongoose.connect('mongodb://127.0.0.1:27017/testfyp')
const db = mongoose.connection
db.once('open',()=>{
    console.log("MongoDB connection successful")
})

const userSchema = new mongoose.Schema({
    name:String,
    email:String,
    phone:String,
    appointment_date:String,
    appointment_time:String,
    notes:String
})

const users = mongoose.model("data",userSchema)

app.get("/",(req,res)=>{
    res.sendFile(path.join(__dirname,'form.html'))
})

app.post('/post',async (req,res)=>{
    const{name,email,phone,appointment_date,appointment_time,notes} = req.body
    const user = new users({
        name,
        email,
        phone,
        appointment_date,
        appointment_time,
        notes
    })
    await user.save()
    console.log(user)
    res.send("form send successful")
})

app.listen(port,()=>{
    console.log("server started")
})