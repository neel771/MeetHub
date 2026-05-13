import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import { Meeting } from "../models/meeting.model.js";
import bcrypt,{hash} from "bcrypt"
import crypto from "crypto";

// User Login

const login = async(req, res)=>{
    const {username, password} = req.body;
    
    if(!username || !password){
        return res.status(400).json({message:"please Provide username and password"});
    }
    try{
        const user = await User.findOne({username})
        if(!user){
            return res.status(httpStatus.NOT_FOUND).json({message:"User not found"});
        }

        let isPasswordCorrect = await bcrypt.compare(password,user.password)

        if(isPasswordCorrect){
            let token = crypto.randomBytes(20).toString('hex');

            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({token: token});
        }else{
            return res.status(httpStatus.UNAUTHORIZED).json({message:"Invalid Username or password"})
        }
    }catch(e){
        return res.status(500).json({message:`Something went wrong ${e}`})
    }

}

// User Registration
const register = async(req, res)=>{
    const {name,username,password}= req.body;

    try{
        const exitingUser = await User.findOne({username});
        if(exitingUser){
            return res.status(httpStatus.FOUND).json({message:"User already exists"});
        }
        const hashedPassword = await bcrypt.hash(password,10);
        const newUser = new User({
            name: name,
            username:username,
            password:hashedPassword //encrypt password
        });
        await newUser.save();
        res.status(httpStatus.CREATED).json({message:"User Registered"})
    }catch(e){
        res.json({message: `Something went wrong ${e}`})

    }

}



// Get Meeting History
const getUserHistory = async (req, res) => {
    const { token } = req.query;
    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }
        const meetings = await Meeting.find({ user_id: user._id }).sort({ date: -1 });
        return res.status(httpStatus.OK).json(meetings);
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong ${e}` });
    }
};

// Add Meeting to History
const addToHistory = async (req, res) => {
    const { token, meetingCode } = req.body;
    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid token" });
        }
        const newMeeting = new Meeting({
            user_id: user._id,
            meetingCode: meetingCode,
            date: new Date()
        });
        await newMeeting.save();
        return res.status(httpStatus.CREATED).json({ message: "Meeting added to history" });
    } catch (e) {
        return res.status(500).json({ message: `Something went wrong ${e}` });
    }
};

export {login, register, addToHistory, getUserHistory}