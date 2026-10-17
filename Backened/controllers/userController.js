import User from "../models/userModel.js";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/metMod.js";

const register = async (req, res) => {
  const { name, username, password } = req.body;

  if (!name || !username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Name, username, and password are required" });
  }

  try {
    const existUser = await User.findOne({ username });
    if (existUser)
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: "User already exists" });

    const hasPass = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name,
      username: username,
      password: hasPass,
    });

    await newUser.save();

    res
      .status(httpStatus.CREATED)
      .json({ message: "User registered successfully" });
  } catch (e) {
    res.json({ message: `Something went wrong: ${e}` });
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username or password missing" });
  }
  try {
    const user = await User.findOne({ username });
    if (!user)
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User not found" });

    const isPasVal = await bcrypt.compare(password, user.password);

    if (!isPasVal) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid username or password" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.token = token;
    await user.save();
    ``;

    return res
      .status(httpStatus.OK)
      .json({ token: token, message: "Login successfull" });
  } catch (e) {
    return res.status(500).json({ message: `Something went wrong ${e}` });
  }
};

const getUserHistory = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ token });

    if (!user) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid or missing token" });
    }

    const meetings = await Meeting.find({ user_id: user.username });

    res.json(meetings);
  } catch (e) {
    res.json({ message: `Something went wrong: ${e}` });
  }
};

const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;

  try {
    const user = await User.findOne({ token });

    if (!user) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid or missing token" });
    }

    const newMeeting = new Meeting({
      user_id: user.username,
      meeting_code: meeting_code,
    });

    await newMeeting.save();

    res.status(httpStatus.CREATED).json({ message: "Added code to history" });
  } catch (e) {
    res.json({ message: `Something went wrong ${e}` });
  }
};

export { login, register, getUserHistory, addToHistory };
